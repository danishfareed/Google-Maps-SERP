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

/** Playwright browsers directory in userData */
export function getPlaywrightBrowsersPath(): string {
  return path.join(getUserDataDir(), 'playwright-browsers');
}

/**
 * Lazily load the bundled playwright-core.
 *
 * playwright-core resolves PLAYWRIGHT_BROWSERS_PATH once, when the module is
 * first required — not on each call. Setting the env var here, immediately
 * before the first require, is what keeps it pointed at our userData folder
 * instead of the default ~/.cache/ms-playwright.
 */
let playwrightCore: typeof import('playwright-core') | undefined;

function loadPlaywrightCore(): typeof import('playwright-core') | undefined {
  if (!playwrightCore) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = getPlaywrightBrowsersPath();
    try {
      playwrightCore = require('playwright-core');
    } catch (err: any) {
      console.error('[paths] playwright-core unavailable:', err?.message);
      return undefined;
    }
  }
  return playwrightCore;
}

/**
 * Find the Playwright chromium executable.
 *
 * Delegates to playwright-core rather than hardcoding directory names: the
 * layout is version-specific (1.58 ships Chrome-for-Testing builds under
 * chrome-win64 / chrome-mac-arm64 / chrome-linux64, where older releases used
 * chrome-win / chrome-mac). A stale hand-written table silently reported
 * "not installed" on every platform, so the app re-downloaded the browser on
 * every launch.
 */
export function getChromiumExecutablePath(): string | undefined {
  const pw = loadPlaywrightCore();
  if (!pw) return undefined;
  try {
    const execPath = pw.chromium.executablePath();
    return execPath && fs.existsSync(execPath) ? execPath : undefined;
  } catch (err: any) {
    console.error('[paths] Could not resolve chromium path:', err?.message);
    return undefined;
  }
}

/**
 * Path to the bundled playwright-core CLI, used to download browsers.
 *
 * In a packaged app this must resolve outside the asar archive: a child
 * process cannot execute a script from inside app.asar, so playwright-core is
 * listed in electron-builder's asarUnpack.
 */
export function getPlaywrightCliPath(): string | undefined {
  try {
    // Resolve via package.json, not 'playwright-core/cli.js' directly:
    // playwright-core declares an "exports" map that does not list ./cli.js,
    // so resolving the subpath throws ERR_PACKAGE_PATH_NOT_EXPORTED.
    // "./package.json" is exported, so derive the package root from it.
    const pkgJson = require.resolve('playwright-core/package.json');
    const cli = path.join(path.dirname(pkgJson), 'cli.js');

    // In a packaged app the module lives inside app.asar, which a child
    // process cannot execute from; electron-builder writes a real copy to
    // app.asar.unpacked (see asarUnpack in electron-builder.yml).
    const unpacked = cli.replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);
    if (fs.existsSync(unpacked)) return unpacked;
    return fs.existsSync(cli) ? cli : undefined;
  } catch (err: any) {
    console.error('[paths] Could not locate playwright-core CLI:', err?.message);
    return undefined;
  }
}
