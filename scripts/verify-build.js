/**
 * Build-invariant verification for the packaged desktop app.
 *
 * Every check here exists because a shipped build broke for real users
 * (see GitHub issues #6-#26). These are packaging/wiring bugs that never
 * show up in `npm run dev` — only in the installed app — so they need an
 * explicit gate in CI.
 *
 * Usage: node scripts/verify-build.js [--packaged]
 *   --packaged  also assert artifacts that only exist after electron:prepare
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packagedMode = process.argv.includes('--packaged');

const results = [];
function check(name, fn) {
  try {
    const detail = fn();
    results.push({ name, ok: true, detail: detail || 'ok' });
  } catch (err) {
    results.push({ name, ok: false, detail: err.message });
  }
}
function read(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) throw new Error(`missing file: ${rel}`);
  return fs.readFileSync(p, 'utf8');
}
/** Strip comments so checks match real code, not the prose explaining it. */
function readCode(rel) {
  return read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

// ── 1. Splash screen must be loadable from the compiled main process ──────
// Issue #6/#7/#9/#17/#19/#23/#26: main.js lives in electron/dist/ and loaded
// `__dirname/splash.html`, but the build never copied the HTML there. The
// splash fell back to a chrome-error page, and the executeJavaScript status
// update then threw "Script failed to execute" on every launch.
check('splash.html resolvable from electron/dist', () => {
  if (!fs.existsSync(path.join(root, 'electron', 'splash.html'))) {
    throw new Error('electron/splash.html missing from source');
  }
  if (!packagedMode) return 'source present (run with --packaged to assert dist copy)';
  const distCopy = path.join(root, 'electron', 'dist', 'splash.html');
  if (!fs.existsSync(distCopy)) {
    throw new Error('electron/dist/splash.html missing — copy-static.js must copy it');
  }
  return 'electron/dist/splash.html present';
});

// Splash status injection must not produce unhandled rejections. A sync
// try/catch cannot catch a rejected executeJavaScript promise.
check('splash status update handles promise rejection', () => {
  const main = read('electron/main.ts');
  const fn = main.slice(main.indexOf('function updateSplashStatus'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  if (!/executeJavaScript/.test(body)) throw new Error('updateSplashStatus no longer injects JS — update this check');
  if (!/\.catch\(/.test(body)) {
    throw new Error('executeJavaScript() result is not .catch()-ed — a missing element rejects and crashes the app');
  }
  return 'rejection handled';
});

// ── 2. CSP must allow every remote image host the UI actually loads ───────
// Issue #24: img-src allowed the OpenStreetMap domains, but the maps load
// tiles from *.basemaps.cartocdn.com, so every map rendered blank/gray.
check('CSP img-src covers all tile hosts used in src/', () => {
  const main = read('electron/main.ts');
  const imgSrc = (main.match(/`img-src[^`]*`/) || [])[0];
  if (!imgSrc) throw new Error('could not locate img-src directive in main.ts');

  const hosts = new Set();
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|jsx?)$/.test(e.name)) {
        const src = fs.readFileSync(p, 'utf8');
        // TileLayer / ImageOverlay style raster URLs
        for (const m of src.matchAll(/https:\/\/([a-z0-9.{}*-]+)\/[^"'`\s]*\.(?:png|jpg|jpeg|webp)/gi)) {
          hosts.add(m[1].replace(/^\{s\}\./, ''));
        }
      }
    }
  })(path.join(root, 'src'));

  const missing = [...hosts].filter((h) => {
    const parts = h.split('.');
    // allow an exact host or a wildcard that covers it
    for (let i = 0; i < parts.length; i++) {
      const candidate = (i === 0 ? '' : '*.') + parts.slice(i).join('.');
      if (imgSrc.includes(candidate)) return false;
    }
    return true;
  });
  if (missing.length) {
    throw new Error(`img-src blocks tile host(s): ${missing.join(', ')}`);
  }
  return hosts.size ? `allows ${[...hosts].join(', ')}` : 'no remote image hosts found';
});

// ── 3. Browser install must not shell out to npx ──────────────────────────
// Issue #8/#10/#11/#13/#16/#20/#21/#22/#25: execFile('npx.cmd', ...) without
// shell:true throws EINVAL on Node >=20.12 (CVE-2024-27980 hardening), and it
// assumed end users have Node installed at all.
check('playwright install does not invoke npx', () => {
  const setup = readCode('electron/playwright-setup.ts');
  if (/npx/.test(setup)) {
    throw new Error('playwright-setup still references npx — spawns EINVAL on Windows and requires system Node');
  }
  if (/execFile\s*\(/.test(setup)) {
    throw new Error('playwright-setup still uses execFile — use spawn(process.execPath) with ELECTRON_RUN_AS_NODE');
  }
  if (!/ELECTRON_RUN_AS_NODE/.test(setup)) {
    throw new Error('playwright-setup should run the bundled CLI via ELECTRON_RUN_AS_NODE');
  }
  return 'uses bundled playwright-core CLI via Electron-as-Node';
});

// The bundled CLI must actually ship, and outside the asar so a child
// process can execute it by real path.
check('playwright-core is packaged and unpacked', () => {
  if (!fs.existsSync(path.join(root, 'node_modules', 'playwright-core', 'cli.js'))) {
    throw new Error('node_modules/playwright-core/cli.js not installed');
  }
  const yml = read('electron-builder.yml');
  if (!/node_modules\/playwright-core\/\*\*/.test(yml)) {
    throw new Error('electron-builder.yml files[] does not include node_modules/playwright-core/**');
  }
  const unpackSection = yml.slice(yml.indexOf('asarUnpack:'));
  if (!/playwright-core/.test(unpackSection.slice(0, 400))) {
    throw new Error('playwright-core must be in asarUnpack so the child process can exec cli.js');
  }
  return 'packaged + unpacked';
});

// The CLI is resolved through package.json because playwright-core's
// "exports" map does not list ./cli.js — resolving that subpath directly
// throws ERR_PACKAGE_PATH_NOT_EXPORTED, which getPlaywrightCliPath() would
// swallow, silently disabling the browser download.
check('playwright-core CLI path actually resolves', () => {
  const pkgJson = require.resolve('playwright-core/package.json');
  const cli = path.join(path.dirname(pkgJson), 'cli.js');
  if (!fs.existsSync(cli)) throw new Error(`derived CLI path does not exist: ${cli}`);

  let direct = null;
  try {
    require.resolve('playwright-core/cli.js');
    direct = 'resolved';
  } catch (err) {
    direct = err.code;
  }
  if (direct === 'resolved') {
    return 'cli.js resolves (exports map now allows the direct subpath too)';
  }
  const src = readCode('electron/paths.ts');
  if (/require\.resolve\(['"]playwright-core\/cli\.js['"]\)/.test(src)) {
    throw new Error(`paths.ts resolves playwright-core/cli.js directly, which throws ${direct}`);
  }
  return `derived via package.json (direct subpath throws ${direct})`;
});

// Next.js standalone tracing strips cli.js, so the standalone copy can never
// run the installer. Documented here so the reason stays visible.
check('standalone playwright-core is not relied on for install', () => {
  const standaloneCli = path.join(root, '.next', 'standalone', 'node_modules', 'playwright-core', 'cli.js');
  if (fs.existsSync(standaloneCli)) return 'standalone cli.js present (unused, fine)';
  return 'standalone cli.js stripped by Next tracing (expected — install uses the asar-unpacked copy)';
});

// ── 4. Browser path resolution must match playwright's own registry ───────
// Issue #11/#18/#26: the hand-written path table expected chrome-win/,
// chrome-mac/Chromium.app and chrome-linux/, but playwright 1.58 installs
// Chrome-for-Testing layouts (chrome-win64, chrome-mac-arm64/Google Chrome
// for Testing.app, chrome-linux64). The "already installed" probe therefore
// never matched, so the app re-downloaded — and re-crashed — every launch.
check('chromium path resolution delegates to playwright-core', () => {
  const paths = readCode('electron/paths.ts');
  if (/chrome-win['"/]|chrome-mac['"/]|Chromium\.app/.test(paths)) {
    throw new Error('paths.ts hardcodes stale browser directory names — delegate to playwright-core executablePath()');
  }
  if (!/playwright-core/.test(paths)) {
    throw new Error('paths.ts should ask playwright-core for the executable path');
  }
  return 'delegates to playwright-core';
});

check('playwright-core resolves a chromium path for this platform', () => {
  const prev = process.env.PLAYWRIGHT_BROWSERS_PATH;
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(root, '.verify-probe');
  try {
    const { chromium } = require('playwright-core');
    const p = chromium.executablePath();
    if (!p || !p.includes('.verify-probe')) {
      throw new Error(`executablePath() ignored PLAYWRIGHT_BROWSERS_PATH: ${p}`);
    }
    return path.basename(path.dirname(p));
  } finally {
    if (prev === undefined) delete process.env.PLAYWRIGHT_BROWSERS_PATH;
    else process.env.PLAYWRIGHT_BROWSERS_PATH = prev;
  }
});

// ── 5. Background browser setup must never crash the app ─────────────────
// A failed/blocked download is recoverable; it must not surface as an
// unhandled rejection crash dialog.
check('ensurePlaywrightBrowser call site catches rejections', () => {
  const main = read('electron/main.ts');
  const idx = main.indexOf('ensurePlaywrightBrowser(mainWindow)');
  if (idx === -1) throw new Error('call site not found — update this check');
  const tail = main.slice(idx, idx + 400);
  if (!/\.catch\(/.test(tail)) {
    throw new Error('ensurePlaywrightBrowser(...) has no .catch() — a download failure becomes a crash dialog');
  }
  return 'rejection handled';
});

// ── Report ────────────────────────────────────────────────────────────────
let failed = 0;
console.log('\nBuild invariant verification\n' + '─'.repeat(60));
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}\n      ${r.detail}`);
  if (!r.ok) failed++;
}
console.log('─'.repeat(60));
console.log(`${results.length - failed}/${results.length} passed\n`);
process.exit(failed ? 1 : 0);
