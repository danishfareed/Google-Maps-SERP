/**
 * Download the Playwright browsers that will be bundled into the packaged app.
 *
 * electron-builder ships ./ms-playwright as the app's `playwright-browsers`
 * resource (see electron-builder.yml), and at runtime the app points
 * PLAYWRIGHT_BROWSERS_PATH at that bundled copy. Bundling removes the fragile
 * first-launch download that caused "Executable doesn't exist" crashes.
 *
 * Runs on the current OS/arch, so each platform's build gets the right binary.
 * Invoked from the `electron:build*` npm scripts (and mirrored in CI).
 */
const { execFileSync } = require('child_process');
const path = require('path');

const dest = path.join(__dirname, '..', 'ms-playwright');

// Resolve the local Playwright CLI and run it with the current Node/Electron
// binary — avoids `npx`, which throws `spawn EINVAL` for `.cmd` shims on Windows.
let cli;
try {
  cli = require.resolve('playwright/cli');
} catch {
  cli = path.join(path.dirname(require.resolve('playwright/package.json')), 'cli.js');
}

console.log(`[bundle-playwright] Installing chromium + chromium-headless-shell into ${dest}`);
execFileSync(process.execPath, [cli, 'install', 'chromium', 'chromium-headless-shell'], {
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: dest },
});
console.log('[bundle-playwright] Done.');
