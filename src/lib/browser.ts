import { chromium as pwChromium, type Browser, type LaunchOptions } from 'playwright-core';

/**
 * Centralized Playwright browser launcher.
 * In Electron, uses PLAYWRIGHT_CHROMIUM_PATH env var for bundled browser.
 * In web dev mode, uses default Playwright chromium.
 */

export const chromium = pwChromium;

export function getElectronLaunchDefaults(): Partial<LaunchOptions> {
    const opts: Partial<LaunchOptions> = {};
    if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
        opts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
    }
    return opts;
}

/**
 * Launch Chromium, translating Playwright's "Executable doesn't exist" error
 * into something a user can act on.
 *
 * The desktop app downloads its browser on first run, in the background. A
 * scan started before that finishes hits Playwright's raw error, which tells
 * the user to run `npx playwright install` — advice that does not apply to an
 * installed desktop app and that users reported as an unexplained failure.
 */
export async function launchChromium(options: LaunchOptions): Promise<Browser> {
    try {
        return await pwChromium.launch(options);
    } catch (err: any) {
        const message = String(err?.message || err);
        if (/Executable doesn't exist|Please run the following command/i.test(message)) {
            throw new Error(
                'The browser engine is still being downloaded (one-time setup, ~130MB). ' +
                'Please wait for it to finish and try again. ' +
                'If this persists, restart the app to retry the download.'
            );
        }
        throw err;
    }
}
