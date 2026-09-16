import { app, BrowserWindow, dialog, ipcMain, Menu, session, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { ChildProcess, spawn, spawnSync } from 'child_process';
import {
  getDatabaseUrl,
  getDatabasePath,
  getDataDir,
  getPlaywrightBrowsersPath,
  getUserDataDir,
  isPackaged,
} from './paths';
import { setupDatabase } from './db-setup';
import { initUpdater, registerVersionHandlers } from './updater';
import { ensurePlaywrightBrowser, setPlaywrightEnvVars } from './playwright-setup';
import { writeCrashReport, checkAndReportPreviousCrash } from './crash-reporter';

// ─── File Logger ──────────────────────────────────────────────────────────
// Writes logs to userData/logs/ for crash diagnostics
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'main.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

function initLogger(): void {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    // Rotate if too large
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_SIZE) {
      const rotated = path.join(LOG_DIR, 'main.prev.log');
      if (fs.existsSync(rotated)) fs.unlinkSync(rotated);
      fs.renameSync(LOG_FILE, rotated);
    }
  } catch { /* best effort */ }
}

function log(level: string, ...args: any[]): void {
  const ts = new Date().toISOString();
  const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  const line = `[${ts}] [${level}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch { /* best effort */ }
  if (level === 'ERROR') console.error(`[main]`, ...args);
  else console.log(`[main]`, ...args);
}

// ─── State ────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let serverPort: number = 3000;
let isQuitting = false;
let serverRestartCount = 0;
const MAX_SERVER_RESTARTS = 3;

// Window state persistence
const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

interface WindowState {
  x?: number; y?: number;
  width: number; height: number;
  isMaximized?: boolean;
}

function loadWindowState(): WindowState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (data.width && data.height) return data;
    }
  } catch {
    // Corrupted state file — delete it so it doesn't fail on every launch
    try { fs.unlinkSync(STATE_FILE); } catch { /* best effort */ }
  }
  return { width: 1440, height: 900 };
}

function saveWindowState(win: BrowserWindow): void {
  try {
    const bounds = win.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: win.isMaximized(),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch { /* best effort */ }
}

// ─── Single Instance Lock ─────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// ─── Window Creation ──────────────────────────────────────────────────────
function createSplashWindow(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: false,
    resizable: false,
    show: true,
    center: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splash.loadFile(path.join(__dirname, 'splash.html'));
  return splash;
}

function createMainWindow(): BrowserWindow {
  const state = loadWindowState();

  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'GBP Rank Tracker',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,       // renderer cannot access Node APIs
      nodeIntegration: false,       // no require() in renderer
      webSecurity: true,            // enforce same-origin policy
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      // Sandbox the renderer — restricts OS-level access even if renderer is compromised
      sandbox: true,
    },
  });

  if (state.isMaximized) win.maximize();

  // Save window state on resize/move (debounced)
  let saveTimeout: NodeJS.Timeout;
  const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveWindowState(win), 500);
  };
  win.on('resize', debouncedSave);
  win.on('move', debouncedSave);

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation away from the app (security + UX)
  win.webContents.on('will-navigate', (event, url) => {
    const serverUrl = `http://127.0.0.1:${serverPort}`;
    if (!url.startsWith(serverUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // macOS: hide window instead of closing (click red X)
  win.on('close', (event) => {
    if (process.platform === 'darwin' && !isQuitting) {
      event.preventDefault();
      win.hide();
    } else {
      saveWindowState(win);
    }
  });

  return win;
}

// ─── Application Menu ─────────────────────────────────────────────────────
function createMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: 'GBP Rank Tracker',
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        // DevTools only available in development — not in packaged app
        ...(!isPackaged() ? [{ role: 'toggleDevTools' as const }] : []),
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open Logs Folder',
          click: () => shell.openPath(LOG_DIR),
        },
        {
          label: 'Open Data Folder',
          click: () => shell.openPath(getUserDataDir()),
        },
        { type: 'separator' },
        {
          label: 'Report a Bug',
          click: () => shell.openExternal('https://github.com/danishfareed/Google-Maps-SERP/issues'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Server Management ───────────────────────────────────────────────────
function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function getServerEnv(port: number): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PORT: String(port),
    HOSTNAME: '127.0.0.1',
    DATABASE_URL: getDatabaseUrl(),
    GEORANKER_DATA_DIR: getDataDir(),
    GEORANKER_IS_ELECTRON: '1',
    PLAYWRIGHT_BROWSERS_PATH: getPlaywrightBrowsersPath(),
    NODE_ENV: 'production',
  };
}

async function startNextServer(): Promise<number> {
  // Set env vars for in-process usage
  process.env.DATABASE_URL = getDatabaseUrl();
  process.env.GEORANKER_DATA_DIR = getDataDir();
  process.env.GEORANKER_IS_ELECTRON = '1';
  process.env.PLAYWRIGHT_BROWSERS_PATH = getPlaywrightBrowsersPath();
  setPlaywrightEnvVars();

  const isDev = !isPackaged();

  if (isDev) {
    const port = parseInt(process.env.PORT || '3000', 10);
    log('INFO', `Waiting for dev server on port ${port}...`);
    await waitForServer(port);
    return port;
  }

  // Production: use standalone server.js from extraResources
  const port = await getAvailablePort();
  const standaloneDir = path.join(process.resourcesPath, 'standalone');
  const serverScript = path.join(standaloneDir, 'server.js');

  log('INFO', `Starting standalone server on port ${port}...`);
  log('INFO', `Server script: ${serverScript}`);

  // Spawn using Electron binary with ELECTRON_RUN_AS_NODE=1
  const child = spawn(process.execPath, [serverScript], {
    cwd: standaloneDir,
    env: {
      ...getServerEnv(port),
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProcess = child;

  child.stdout.on('data', (data: Buffer) => {
    log('INFO', `[next] ${data.toString().trim()}`);
  });

  child.stderr.on('data', (data: Buffer) => {
    log('ERROR', `[next] ${data.toString().trim()}`);
  });

  child.on('error', (err) => {
    log('ERROR', 'Server process error:', err.message);
  });

  // Auto-restart if server crashes unexpectedly (max 3 attempts)
  serverProcess.on('exit', (code, signal) => {
    log('INFO', `Server exited with code ${code}, signal ${signal}`);
    if (!isQuitting && code !== 0 && code !== null) {
      serverRestartCount++;
      if (serverRestartCount > MAX_SERVER_RESTARTS) {
        log('ERROR', `Server crashed ${MAX_SERVER_RESTARTS} times, giving up`);
        showFatalError('Server Error', `The app server crashed ${MAX_SERVER_RESTARTS} times and could not recover. Please reopen the app.\n\nIf this keeps happening, check the logs for details.`);
        return;
      }
      log('ERROR', `Server crashed (attempt ${serverRestartCount}/${MAX_SERVER_RESTARTS}), restarting in 2s...`);
      setTimeout(() => {
        if (!isQuitting) {
          startNextServer()
            .then((newPort) => {
              serverPort = newPort;
              serverRestartCount = 0; // reset on successful restart
              mainWindow?.loadURL(`http://127.0.0.1:${serverPort}`).catch((err) => {
                log('ERROR', 'Failed to reload window after server restart:', err.message);
              });
              log('INFO', `Server restarted on port ${serverPort}`);
            })
            .catch((err) => {
              log('ERROR', 'Server restart failed:', err.message);
              showFatalError('Server Error', 'The app server crashed and could not restart. Please reopen the app.');
            });
        }
      }, 2000);
    }
  });

  await waitForServer(port);
  return port;
}

async function waitForServer(port: number, timeout = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const http = require('http');
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}`, (res: any) => {
          res.resume();
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Server did not start within ${timeout}ms`);
}

function killServer(): void {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.removeAllListeners('exit'); // prevent restart on intentional kill

    if (process.platform === 'win32' && serverProcess.pid) {
      // On Windows, kill the entire process tree synchronously.
      // async spawn() leaves orphaned child processes if the parent exits first.
      try {
        spawnSync('taskkill', ['/pid', String(serverProcess.pid), '/T', '/F'], {
          stdio: 'ignore',
          timeout: 5000,
        });
      } catch {
        serverProcess.kill();
      }
    } else {
      serverProcess.kill();
    }

    serverProcess = null;
  }
}

// ─── Error Handling ───────────────────────────────────────────────────────
function showFatalError(title: string, message: string): void {
  log('ERROR', `FATAL: ${title} — ${message}`);
  dialog.showErrorBox(title, `${message}\n\nLogs: ${LOG_DIR}`);
  app.quit();
}

// ─── Database Backup ──────────────────────────────────────────────────────
function backupDatabase(): void {
  const dbPath = getDatabasePath();
  if (!fs.existsSync(dbPath)) return;

  try {
    const backupDir = path.join(getUserDataDir(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // Keep only last 3 backups
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db'))
      .sort()
      .reverse();
    for (const old of backups.slice(2)) {
      fs.unlinkSync(path.join(backupDir, old));
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);
    fs.copyFileSync(dbPath, backupPath);
    log('INFO', `Database backed up to ${backupPath}`);
  } catch (err: any) {
    log('ERROR', 'Database backup failed:', err.message);
  }
}

// ─── IPC: Expose log path ─────────────────────────────────────────────────

function registerUtilityHandlers(): void {
  ipcMain.handle('get-log-path', () => LOG_DIR);
  ipcMain.handle('get-data-path', () => getUserDataDir());
}

/**
 * Apply Content Security Policy to the default session.
 * Runs before any window loads content from the local Next.js server.
 *
 * Why each directive:
 *  - default-src self+localhost  : allow only our embedded server
 *  - script-src unsafe-inline/eval: required by Next.js hydration
 *  - img-src tiles+data          : Leaflet map tiles and data URIs
 *  - connect-src external APIs   : geocoding, Overpass, GitHub updates
 *  - frame-src none              : no iframes (prevents clickjacking)
 *  - object-src none             : no plugins (Flash etc.)
 *  - base-uri self               : prevents base tag hijacking
 */
function applyContentSecurityPolicy(port: number): void {
  const localOrigin = `http://127.0.0.1:${port}`;
  const csp = [
    `default-src 'self' ${localOrigin}`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${localOrigin}`,
    `style-src 'self' 'unsafe-inline' ${localOrigin}`,
    `font-src 'self' data: ${localOrigin}`,
    // Map tiles and data URIs for Leaflet markers.
    //  - *.tile.openstreetmap.org / *.openstreetmap.org: OSM raster tiles
    //  - *.basemaps.cartocdn.com: CARTO "voyager" basemap tiles (default in Map/MiniMap)
    `img-src 'self' data: blob: ${localOrigin} https://*.tile.openstreetmap.org https://*.openstreetmap.org https://*.basemaps.cartocdn.com`,
    // External APIs this app uses:
    //  - nominatim: address geocoding
    //  - overpass-api: smart grid neighborhood lookup
    //  - api.github.com: update version check
    //  - objects.githubusercontent.com: update download
    `connect-src 'self' ${localOrigin} https://nominatim.openstreetmap.org https://overpass-api.de https://api.github.com https://objects.githubusercontent.com https://github.com`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'Referrer-Policy': ['no-referrer'],
      },
    });
  });
}

// ─── App Lifecycle ────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  initLogger();
  log('INFO', `App starting. Version ${app.getVersion()}, packaged=${isPackaged()}`);
  log('INFO', `Platform: ${process.platform} ${process.arch}, Electron ${process.versions.electron}`);
  log('INFO', `User data: ${getUserDataDir()}`);

  try {
    // Create menu bar
    createMenu();

    // Show splash
    splashWindow = createSplashWindow();

    // Backup DB before any migrations
    log('INFO', 'Backing up database...');
    backupDatabase();

    // Setup database
    log('INFO', 'Setting up database...');
    updateSplashStatus('Initializing database...');
    setupDatabase();

    // Start server
    log('INFO', 'Starting server...');
    updateSplashStatus('Starting server...');
    serverPort = await startNextServer();
    log('INFO', `Server ready on port ${serverPort}`);

    // Apply Content Security Policy now that we know the server port
    applyContentSecurityPolicy(serverPort);

    // Create and show main window
    mainWindow = createMainWindow();
    updateSplashStatus('Loading interface...');
    await mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

    mainWindow.show();
    closeSplash();

    // Check for crash reports from the previous session
    checkAndReportPreviousCrash();

    // Register IPC handlers
    registerVersionHandlers();
    registerUtilityHandlers();

    // Initialize auto-updater (production only)
    if (isPackaged()) {
      initUpdater(mainWindow);
    }

    // Check Playwright browsers in background
    ensurePlaywrightBrowser(mainWindow).then((installed) => {
      if (installed) setPlaywrightEnvVars();
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Capture renderer process crashes
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
      if (details.reason !== 'clean-exit') {
        const err = new Error(`Renderer process gone: ${details.reason} (exitCode ${details.exitCode})`);
        log('ERROR', err.message);
        writeCrashReport(err, LOG_FILE);
      }
    });

  } catch (err: any) {
    log('ERROR', 'Fatal startup error:', err.message, err.stack);
    closeSplash();
    showFatalError(
      'Startup Failed',
      `GBP Rank Tracker could not start.\n\n${err.message}`
    );
  }
});

// macOS: re-show window when clicking dock icon
app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});

// macOS: hide window on close, only quit via Cmd+Q or menu
app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    killServer();
    app.quit();
  }
});

app.on('will-quit', () => {
  killServer();
});

// ─── Helpers ──────────────────────────────────────────────────────────────
function updateSplashStatus(message: string): void {
  if (!splashWindow || splashWindow.isDestroyed()) return;

  // Escape backslashes first, then single quotes, for safe embedding.
  const safe = message.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  // Guard the element inside the injected script so it never throws even if
  // the DOM isn't ready yet, and swallow the promise rejection — executeJavaScript
  // returns a Promise, so a renderer-side throw here would otherwise surface as
  // an unhandledRejection ("Script failed to execute") and be logged as a crash.
  const run = () => {
    if (!splashWindow || splashWindow.isDestroyed()) return;
    splashWindow.webContents
      .executeJavaScript(`{ const el = document.getElementById('status'); if (el) { el.textContent = '${safe}'; } }`)
      .catch(() => { /* splash not ready or already closed — non-fatal */ });
  };

  // If the splash page is still loading, getElementById would return null;
  // wait for the DOM before injecting.
  if (splashWindow.webContents.isLoadingMainFrame()) {
    splashWindow.webContents.once('did-finish-load', run);
  } else {
    run();
  }
}

function closeSplash(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

// ─── Global Error Handlers ────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  log('ERROR', 'Uncaught exception:', err.message, err.stack);
  writeCrashReport(err, LOG_FILE);
});

process.on('unhandledRejection', (err: any) => {
  log('ERROR', 'Unhandled rejection:', err?.message || err);
  if (err instanceof Error) writeCrashReport(err, LOG_FILE);
});

// Windows: handle Ctrl+Break and system shutdown signals
if (process.platform === 'win32') {
  process.on('SIGBREAK', () => {
    isQuitting = true;
    killServer();
    app.quit();
  });
}
