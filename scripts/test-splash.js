/**
 * Runtime regression test for the splash-screen crash (issues #6/#7/#9/#17/#19/#23/#26).
 *
 * Reproduces both paths:
 *   1. happy path  — splash.html present, status text updates
 *   2. failure path— splash.html missing, status update must NOT produce an
 *                    unhandled rejection (that rejection was the crash dialog)
 *
 * Run: npx electron scripts/test-splash.js
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const results = [];
let unhandledRejections = [];

process.on('unhandledRejection', (err) => {
  unhandledRejections.push(err && err.message ? err.message : String(err));
});

// Destroying a window mid-test would otherwise trigger Electron's default
// "quit when all windows are closed" behaviour and end the run early.
app.on('window-all-closed', () => { /* keep the test process alive */ });

/** Mirrors updateSplashStatus() in electron/main.ts */
function updateSplashStatus(win, message) {
  try {
    if (win && !win.isDestroyed()) {
      win.webContents
        .executeJavaScript(
          `(() => { const el = document.getElementById('status'); if (el) el.textContent = ${JSON.stringify(message)}; })()`
        )
        .catch(() => { /* splash closed, or content never loaded */ });
    }
  } catch { /* splash may be gone */ }
}

function makeWindow() {
  return new BrowserWindow({
    width: 400, height: 300, show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  // ── 1. Happy path: the file the build now produces ──────────────────────
  const splashFile = path.join(__dirname, '..', 'electron', 'dist', 'splash.html');
  results.push({
    name: 'electron/dist/splash.html exists after build',
    ok: fs.existsSync(splashFile),
    detail: splashFile,
  });

  if (fs.existsSync(splashFile)) {
    const win = makeWindow();
    let loadErr = null;
    await win.loadFile(splashFile).catch((e) => { loadErr = e.message; });
    results.push({ name: 'splash.html loads without error', ok: !loadErr, detail: loadErr || 'loaded' });

    updateSplashStatus(win, 'Initializing database...');
    await wait(300);

    const text = await win.webContents
      .executeJavaScript(`document.getElementById('status') && document.getElementById('status').textContent`)
      .catch(() => null);
    results.push({
      name: 'status element updates',
      ok: text === 'Initializing database...',
      detail: `textContent = ${JSON.stringify(text)}`,
    });

    // Quotes/newlines must not break the injected script (JSON.stringify escaping)
    updateSplashStatus(win, `It's "loading"\n<script>`);
    await wait(300);
    const tricky = await win.webContents
      .executeJavaScript(`document.getElementById('status').textContent`)
      .catch((e) => `ERROR: ${e.message}`);
    results.push({
      name: 'status text with quotes/newlines is escaped safely',
      ok: tricky === `It's "loading"\n<script>`,
      detail: `textContent = ${JSON.stringify(tricky)}`,
    });

    win.destroy();
  }

  // ── 2. Failure path: this is what crashed for users ─────────────────────
  unhandledRejections = [];
  const badWin = makeWindow();
  let caught = null;
  await badWin.loadFile(path.join(__dirname, '..', 'electron', 'dist', '__no_such_splash__.html'))
    .catch((e) => { caught = e.message; });
  results.push({
    name: 'missing splash file rejects a catchable promise',
    ok: !!caught,
    detail: caught || 'loadFile did not reject',
  });

  // On the resulting error page there is no #status element — the old code
  // threw here and nothing caught it.
  updateSplashStatus(badWin, 'Starting server...');
  updateSplashStatus(badWin, 'Loading interface...');
  await wait(800);

  results.push({
    name: 'status update on a failed splash produces NO unhandled rejection',
    ok: unhandledRejections.length === 0,
    detail: unhandledRejections.length
      ? `got: ${unhandledRejections.join(' | ')}`
      : 'no unhandled rejections',
  });
  badWin.destroy();

  // ── Report ──────────────────────────────────────────────────────────────
  let failed = 0;
  const lines = ['', 'Splash regression test', '─'.repeat(60)];
  for (const r of results) {
    lines.push(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`, `      ${r.detail}`);
    if (!r.ok) failed++;
  }
  lines.push('─'.repeat(60), `${results.length - failed}/${results.length} passed`, '');
  const report = lines.join('\n');
  console.log(report);
  // Electron on macOS does not reliably pipe stdout when launched from the
  // .app binary, so also write the report where CI can read it.
  if (process.env.SPLASH_TEST_REPORT) {
    try { fs.writeFileSync(process.env.SPLASH_TEST_REPORT, report); } catch { /* best effort */ }
  }
  app.exit(failed ? 1 : 0);
}

app.whenReady().then(run).catch((err) => {
  console.error('test harness error:', err);
  app.exit(1);
});
