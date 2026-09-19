/**
 * Crash Reporter — zero-infrastructure crash reporting for the Electron app.
 *
 * On uncaught exception:  write a sanitized crash-report JSON to userData/crash-reports/
 * On next launch:         detect the file, show a dialog, open a pre-filled GitHub issue
 *
 * Nothing is sent automatically — the user must click "Report on GitHub"
 * and submit via their own GitHub account. No tokens, no servers.
 */

import { app, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';

const CRASH_DIR = path.join(app.getPath('userData'), 'crash-reports');
const GITHUB_ISSUES_URL = 'https://github.com/danishfareed/Google-Maps-SERP/issues/new';

// Max lines to include in the report to keep the GitHub URL manageable
const MAX_STACK_LINES = 20;
const MAX_LOG_LINES = 25;

interface CrashReport {
  timestamp: string;
  appVersion: string;
  platform: string;
  arch: string;
  osVersion: string;
  electronVersion: string;
  nodeVersion: string;
  error: string;
  stack: string;
  logTail: string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Write a crash report for an unhandled error.
 * Call this from process.on('uncaughtException') / process.on('unhandledRejection').
 * Safe to call before app.whenReady() — does not use Electron APIs.
 */
export function writeCrashReport(error: Error | string, logFile: string): void {
  try {
    fs.mkdirSync(CRASH_DIR, { recursive: true });

    const errorMsg = typeof error === 'string' ? error : (error.message ?? String(error));
    const rawStack = typeof error === 'object' && error.stack ? error.stack : '';

    const stack = sanitizePaths(
      rawStack.split('\n').slice(0, MAX_STACK_LINES).join('\n')
    );

    let logTail = '';
    try {
      if (fs.existsSync(logFile)) {
        const lines = fs.readFileSync(logFile, 'utf-8').split('\n');
        logTail = sanitizePaths(
          lines.filter(l => l.trim()).slice(-MAX_LOG_LINES).join('\n')
        );
      }
    } catch { /* best effort */ }

    const report: CrashReport = {
      timestamp: new Date().toISOString(),
      appVersion: safeGetVersion(),
      platform: process.platform,
      arch: process.arch,
      osVersion: os.release(),
      electronVersion: process.versions.electron ?? 'unknown',
      nodeVersion: process.versions.node ?? 'unknown',
      error: sanitizePaths(errorMsg),
      stack,
      logTail,
    };

    const filename = `crash-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(CRASH_DIR, filename),
      JSON.stringify(report, null, 2)
    );
  } catch { /* crash reporter must never throw */ }
}

/**
 * Call this after the main window is shown.
 * If a crash report exists from the previous session, shows a dialog asking
 * the user to report it. Opens a pre-filled GitHub issue URL if they agree.
 */
export function checkAndReportPreviousCrash(): void {
  try {
    if (!fs.existsSync(CRASH_DIR)) return;

    const files = fs.readdirSync(CRASH_DIR)
      .filter(f => f.endsWith('.json'))
      .sort();

    if (files.length === 0) return;

    // Read the first (oldest) crash report
    const reportPath = path.join(CRASH_DIR, files[0]);
    let report: CrashReport;
    try {
      report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    } catch {
      // Corrupted — clean up and ignore
      for (const f of files) {
        try { fs.unlinkSync(path.join(CRASH_DIR, f)); } catch { /* best effort */ }
      }
      return;
    }

    // Delete all pending reports (we show one dialog, not one per crash)
    for (const f of files) {
      try { fs.unlinkSync(path.join(CRASH_DIR, f)); } catch { /* best effort */ }
    }

    const count = files.length;
    const countMsg = count > 1 ? ` (${count} crashes detected)` : '';

    const choice = dialog.showMessageBoxSync({
      type: 'warning',
      title: 'GBP Rank Tracker Crashed',
      message: `The app crashed during the previous session${countMsg}`,
      detail:
        `Error: ${report.error}\n\n` +
        `Would you like to report this to the developer? Clicking "Report" will open a ` +
        `pre-filled GitHub issue in your browser. You can review everything before submitting.\n\n` +
        `No personal data (keywords, business names, rankings) is included — only the ` +
        `error message, stack trace, and app version.`,
      buttons: ['Report on GitHub', 'Dismiss'],
      defaultId: 0,
      cancelId: 1,
    });

    if (choice === 0) {
      shell.openExternal(buildGitHubIssueUrl(report));
    }
  } catch { /* best effort */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeGetVersion(): string {
  try { return app.getVersion(); } catch { return 'unknown'; }
}

/**
 * Strip home directory, userData path, and Windows/Unix username patterns
 * so the crash report cannot identify the user's system username.
 */
function sanitizePaths(text: string): string {
  let result = text;

  // Replace home directory
  const home = os.homedir();
  if (home) result = result.split(home).join('<home>');

  // Replace userData path
  try {
    const userData = app.getPath('userData');
    if (userData) result = result.split(userData).join('<userData>');
  } catch { /* app may not be ready */ }

  // Replace remaining Windows-style user paths: C:\Users\anything
  result = result.replace(/[A-Z]:\\Users\\[^\\]+/gi, '<home>');

  // Replace remaining Unix-style user paths: /home/anything or /Users/anything
  result = result.replace(/\/(home|Users)\/[^\s/]+/g, '<home>');

  return result;
}

function buildGitHubIssueUrl(report: CrashReport): string {
  // Keep title short — GitHub truncates it in the UI anyway
  // [\s\S] rather than the `s` (dotAll) flag: the root tsconfig targets ES2017,
  // where that flag is not available.
  const shortError = report.error.replace(/\n[\s\S]*/, '').substring(0, 100);
  const title = `[Crash] ${shortError}`;

  const body = [
    '## Crash Report',
    '',
    '> **Auto-generated.** Add any extra context above this line before submitting.',
    '',
    '### Environment',
    `| Key | Value |`,
    `|-----|-------|`,
    `| App Version | \`${report.appVersion}\` |`,
    `| Platform | \`${report.platform} ${report.arch}\` |`,
    `| OS Version | \`${report.osVersion}\` |`,
    `| Electron | \`${report.electronVersion}\` |`,
    `| Node.js | \`${report.nodeVersion}\` |`,
    `| Timestamp | \`${report.timestamp}\` |`,
    '',
    '### Error',
    '```',
    report.error,
    '```',
    '',
    ...(report.stack ? [
      '### Stack Trace',
      '```',
      report.stack,
      '```',
      '',
    ] : []),
    ...(report.logTail ? [
      '### Recent Log',
      '```',
      report.logTail,
      '```',
    ] : []),
  ].join('\n');

  // GitHub URLs have a practical limit around 8000 chars for the body param
  const params = new URLSearchParams({ title, body, labels: 'crash-report' });
  const url = `${GITHUB_ISSUES_URL}?${params.toString()}`;

  // If the URL is too long, strip the log tail and try again
  if (url.length > 8000) {
    const shortBody = body.replace(
      /### Recent Log[\s\S]*/,
      '### Recent Log\n*(truncated — check local logs)*'
    );
    const shortParams = new URLSearchParams({ title, body: shortBody, labels: 'crash-report' });
    return `${GITHUB_ISSUES_URL}?${shortParams.toString()}`;
  }

  return url;
}
