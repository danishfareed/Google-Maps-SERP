import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * Path resolution for GBP Rank Tracker.
 * Handles three contexts: npm run dev, electron:dev, and packaged app.
 */

export function isPackaged(): boolean {
  return app.isPackaged;
}

/** User data directory — persists across updates */
export function getUserDataDir(): string {
  return app.getPath('userData');
}

/** Database file path in userData */
export function getDatabasePath(): string {
  return path.join(getUserDataDir(), 'gbp-rank-tracker.db');
}

/** Database URL for Prisma */
export function getDatabaseUrl(): string {
  return `file:${getDatabasePath()}`;
}

/**
 * App resources directory — where bundled files live.
 * Packaged: process.resourcesPath (inside .app/Contents/Resources)
 * Dev: project root
 */
export function getResourcesDir(): string {
  if (isPackaged()) {
    return process.resourcesPath;
  }
  return path.resolve(__dirname, '..');
}

/** Data directory containing postal/ JSON files */
export function getDataDir(): string {
  return path.join(getResourcesDir(), 'data');
}

/**
 * Next.js app directory — where .next/ and package.json live.
 * Packaged: inside resources (standalone output)
 * Dev: project root
 */
export function getAppDir(): string {
  if (isPackaged()) {
    return path.join(process.resourcesPath, 'app');
  }
  return path.resolve(__dirname, '..');
}

/**
 * Playwright browsers directory.
 *
 * Packaged builds ship Chromium inside app resources (`playwright-browsers/`,
 * populated at build time), so there is no runtime download. We prefer that
 * bundled copy when present; otherwise (dev, or a build without bundled
 * browsers) we fall back to a writable userData dir that the runtime
 * downloader can populate.
 */
export function getPlaywrightBrowsersPath(): string {
  if (isPackaged()) {
    const bundled = path.join(process.resourcesPath, 'playwright-browsers');
    if (fs.existsSync(bundled)) return bundled;
  }
  return path.join(getUserDataDir(), 'playwright-browsers');
}

/**
 * Find a usable Playwright Chromium executable.
 *
 * Playwright installs two flavours into the browsers dir:
 *  - `chromium-<rev>`               → full Chromium (headful + headless)
 *  - `chromium_headless_shell-<rev>` → the lightweight headless shell that
 *                                      `headless: true` launches resolve to
 * Either binary works for our headless-only scanning, so we accept both. The
 * headless shell is preferred when present because it's what headless launches
 * actually use; we fall back to the full build otherwise.
 */
export function getChromiumExecutablePath(): string | undefined {
  const browsersDir = getPlaywrightBrowsersPath();
  if (!fs.existsSync(browsersDir)) return undefined;

  const entries = fs.readdirSync(browsersDir);

  const findExecutable = (dirName: string): string | undefined => {
    const base = path.join(browsersDir, dirName);
    const candidates = [
      // Full Chromium
      path.join(base, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      path.join(base, 'chrome-linux', 'chrome'),
      path.join(base, 'chrome-win', 'chrome.exe'),
      // Headless shell (dir name varies by platform/arch, e.g.
      // chrome-headless-shell-mac-arm64, -linux, -win64)
      path.join(base, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell'),
      path.join(base, 'chrome-headless-shell-mac-x64', 'chrome-headless-shell'),
      path.join(base, 'chrome-headless-shell-linux', 'chrome-headless-shell'),
      path.join(base, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
      path.join(base, 'chrome-headless-shell-win', 'chrome-headless-shell.exe'),
    ];
    return candidates.find(p => fs.existsSync(p));
  };

  // Prefer the headless shell (what `headless: true` uses), then full Chromium.
  const headlessDir = entries.find(e => e.startsWith('chromium_headless_shell-'));
  if (headlessDir) {
    const exec = findExecutable(headlessDir);
    if (exec) return exec;
  }

  const chromiumDir = entries.find(e => e.startsWith('chromium-') || e.startsWith('chromium_'));
  if (chromiumDir) {
    const exec = findExecutable(chromiumDir);
    if (exec) return exec;
  }

  return undefined;
}
