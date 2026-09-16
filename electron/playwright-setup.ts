import { BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getPlaywrightBrowsersPath, getChromiumExecutablePath } from './paths';

/**
 * Resolve the playwright-core CLI entry point (`cli.js`).
 *
 * We never shell out to `npx`: it isn't present in a packaged app and, on
 * Windows, spawning `npx.cmd` throws `spawn EINVAL` under Node ≥20 (which
 * refuses to spawn `.cmd`/`.bat` files without an explicit shell). Instead we
 * run the CLI directly with the Electron binary in Node mode — the same
 * approach already used to launch the standalone Next.js server.
 */
function resolvePlaywrightCliPath(): string | undefined {
  // Dev / when playwright-core is resolvable from the main process. The `cli`
  // subpath isn't a guaranteed export, so also derive cli.js from the package
  // root.
  try {
    return require.resolve('playwright-core/cli');
  } catch { /* try package root next */ }
  try {
    const pkg = require.resolve('playwright-core/package.json');
    const cli = path.join(path.dirname(pkg), 'cli.js');
    if (fs.existsSync(cli)) return cli;
  } catch { /* fall through to packaged locations */ }

  // Packaged app: playwright-core ships inside the Next.js standalone bundle.
  const candidates = [
    path.join(process.resourcesPath || '', 'standalone', 'node_modules', 'playwright-core', 'cli.js'),
    path.join(process.resourcesPath || '', 'app', 'node_modules', 'playwright-core', 'cli.js'),
  ];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Check if Playwright Chromium is installed, download if needed.
 * Sends progress updates to the renderer via IPC.
 */
export async function ensurePlaywrightBrowser(win: BrowserWindow | null): Promise<boolean> {
  const browsersPath = getPlaywrightBrowsersPath();

  // Check if chromium is already installed
  const execPath = getChromiumExecutablePath();
  if (execPath && fs.existsSync(execPath)) {
    console.log('[playwright-setup] Chromium found at:', execPath);
    return true;
  }

  console.log('[playwright-setup] Chromium not found, downloading...');
  win?.webContents.send('playwright-status', { status: 'downloading', message: 'Downloading browser engine (one-time setup)...' });

  // Ensure browsers directory exists
  if (!fs.existsSync(browsersPath)) {
    fs.mkdirSync(browsersPath, { recursive: true });
  }

  const cliPath = resolvePlaywrightCliPath();
  if (!cliPath) {
    console.error('[playwright-setup] Could not locate playwright-core CLI; skipping download.');
    win?.webContents.send('playwright-status', {
      status: 'error',
      message: 'Browser engine unavailable. Scanning will use system Chrome as fallback.',
    });
    return false;
  }

  return new Promise((resolve) => {
    const env = {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: browsersPath,
      // Run the Electron binary as plain Node so it executes the CLI script.
      ELECTRON_RUN_AS_NODE: '1',
    };

    // Install both the full Chromium and the headless shell. `headless: true`
    // launches (all scanning uses them) resolve to `chrome-headless-shell`, so
    // omitting it leaves the shell missing and launches fail with
    // "Executable doesn't exist".
    const args = [cliPath, 'install', 'chromium', 'chromium-headless-shell'];
    // 10 min timeout — Chromium is ~130MB and slow connections need the headroom
    const child = spawn(process.execPath, args, { env, timeout: 600000 });

    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    child.on('error', (err) => {
      console.error('[playwright-setup] Download failed:', err.message);
      win?.webContents.send('playwright-status', {
        status: 'error',
        message: 'Browser download failed. Scanning will use system Chrome as fallback.',
      });
      settle(false);
    });

    child.on('close', (code) => {
      // Verify the executable actually landed rather than trusting the exit code.
      const installed = code === 0 && !!getChromiumExecutablePath();
      if (installed) {
        console.log('[playwright-setup] Chromium installed successfully');
        win?.webContents.send('playwright-status', {
          status: 'ready',
          message: 'Browser engine ready.',
        });
        settle(true);
      } else {
        console.error(`[playwright-setup] Download failed (exit code ${code}).`);
        win?.webContents.send('playwright-status', {
          status: 'error',
          message: 'Browser download failed. Scanning will use system Chrome as fallback.',
        });
        settle(false);
      }
    });

    // Stream stdout for progress indication
    child.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        win?.webContents.send('playwright-status', { status: 'downloading', message: msg });
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) console.error('[playwright-setup]', msg);
    });
  });
}

/** Set environment variables for Playwright before any scanner code runs */
export function setPlaywrightEnvVars(): void {
  const browsersPath = getPlaywrightBrowsersPath();
  process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

  const execPath = getChromiumExecutablePath();
  if (execPath) {
    process.env.PLAYWRIGHT_CHROMIUM_PATH = execPath;
  }
}
