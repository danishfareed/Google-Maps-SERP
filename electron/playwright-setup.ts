import { BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import fs from 'fs';
import {
  getPlaywrightBrowsersPath,
  getChromiumExecutablePath,
  getPlaywrightCliPath,
} from './paths';

/** Chromium is ~130MB; slow connections need the headroom. */
const DOWNLOAD_TIMEOUT_MS = 600_000;

function sendStatus(win: BrowserWindow | null, status: string, message: string): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send('playwright-status', { status, message });
  }
}

/**
 * Check if Playwright Chromium is installed, download if needed.
 * Sends progress updates to the renderer via IPC.
 *
 * The download runs the *bundled* playwright-core CLI under the Electron
 * binary in Node mode (ELECTRON_RUN_AS_NODE=1). Two reasons this is not
 * `npx playwright install`:
 *
 *  1. `execFile('npx.cmd', ...)` without `shell: true` throws EINVAL on
 *     Node >= 20.12 / Electron 34 (the CVE-2024-27980 hardening), so it
 *     failed for every Windows user.
 *  2. npx would fetch the *latest* playwright-core and install its browser
 *     revision, while the app runs the pinned playwright-core and looks for
 *     that revision — a mismatch that left users with a downloaded browser
 *     the app still reported as missing.
 *
 * Running the bundled CLI keeps the revision in lockstep and removes the
 * requirement that end users have Node.js installed at all.
 *
 * Never rejects — a failed download is recoverable (the scanner falls back to
 * system Chrome), so it must not surface as a crash dialog.
 */
export async function ensurePlaywrightBrowser(win: BrowserWindow | null): Promise<boolean> {
  try {
    const browsersPath = getPlaywrightBrowsersPath();

    // Already installed?
    const existing = getChromiumExecutablePath();
    if (existing) {
      console.log('[playwright-setup] Chromium found at:', existing);
      return true;
    }

    const cliPath = getPlaywrightCliPath();
    if (!cliPath) {
      console.error('[playwright-setup] Bundled playwright-core CLI not found — skipping download.');
      sendStatus(win, 'error', 'Browser engine unavailable. Scanning will use system Chrome as fallback.');
      return false;
    }

    console.log('[playwright-setup] Chromium not found, downloading via', cliPath);
    sendStatus(win, 'downloading', 'Downloading browser engine (one-time setup)...');

    if (!fs.existsSync(browsersPath)) {
      fs.mkdirSync(browsersPath, { recursive: true });
    }

    const ok = await runInstall(cliPath, browsersPath, win);

    if (ok && getChromiumExecutablePath()) {
      console.log('[playwright-setup] Chromium installed successfully');
      sendStatus(win, 'ready', 'Browser engine ready.');
      return true;
    }

    console.error('[playwright-setup] Install finished but Chromium still not found.');
    sendStatus(win, 'error', 'Browser download failed. Scanning will use system Chrome as fallback.');
    return false;
  } catch (err: any) {
    // Belt and braces: this function must never reject.
    console.error('[playwright-setup] Unexpected setup error:', err?.message);
    sendStatus(win, 'error', 'Browser download failed. Scanning will use system Chrome as fallback.');
    return false;
  }
}

/**
 * Run `playwright-core install chromium chromium-headless-shell`.
 *
 * Both targets are installed: the scanner launches headless, which resolves to
 * the separate chromium-headless-shell build.
 */
function runInstall(
  cliPath: string,
  browsersPath: string,
  win: BrowserWindow | null
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const child = spawn(
      process.execPath,
      [cliPath, 'install', 'chromium', 'chromium-headless-shell'],
      {
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          PLAYWRIGHT_BROWSERS_PATH: browsersPath,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }
    );

    const timer = setTimeout(() => {
      console.error('[playwright-setup] Download timed out.');
      child.kill();
      finish(false);
    }, DOWNLOAD_TIMEOUT_MS);

    const onOutput = (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        console.log('[playwright-setup]', msg);
        sendStatus(win, 'downloading', msg.split('\n').pop() || msg);
      }
    };

    child.stdout?.on('data', onOutput);
    child.stderr?.on('data', onOutput);

    // Covers ENOENT/EACCES on spawn itself rather than throwing.
    child.on('error', (err) => {
      console.error('[playwright-setup] Download failed:', err.message);
      finish(false);
    });

    child.on('close', (code) => {
      if (code !== 0) console.error(`[playwright-setup] Installer exited with code ${code}`);
      finish(code === 0);
    });
  });
}

/** Set environment variables for Playwright before any scanner code runs */
export function setPlaywrightEnvVars(): void {
  process.env.PLAYWRIGHT_BROWSERS_PATH = getPlaywrightBrowsersPath();

  const execPath = getChromiumExecutablePath();
  if (execPath) {
    process.env.PLAYWRIGHT_CHROMIUM_PATH = execPath;
  }
}
