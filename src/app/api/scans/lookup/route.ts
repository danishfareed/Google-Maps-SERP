import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
    let browser: any = null;
    try {
        const body = await request.json();
        const { query, url } = body;

        if (!query && !url) {
            return NextResponse.json({ error: 'Query or URL is required' }, { status: 400 });
        }

        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        const page = await context.newPage();

        if (url) {
            // Force English language on Google URLs
            let targetUrl = url;
            try {
                const parsedUrl = new URL(url);
                if (parsedUrl.hostname.includes('google.com') || parsedUrl.hostname.includes('goo.gl')) {
                    parsedUrl.searchParams.set('hl', 'en');
                    targetUrl = parsedUrl.toString();
                }
            } catch (e) {
                // If URL parsing fails, just use original
            }

            await logger.info(`Looking up business from URL: ${targetUrl}`, 'API');
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Handle Google Consent (supports English, German, Arabic, etc.)
            try {
                // Look for common "Accept all" buttons in multiple languages
                const consentSelector = 'button[aria-label="Accept all"], button[aria-label="Alle akzeptieren"], button[aria-label="قبول الكل"], form[action*="consent"] button:last-child';
                if (await page.locator(consentSelector).first().isVisible({ timeout: 5000 })) {
                    await logger.info('Consent dialog detected. Clicking accept...', 'API');
                    await page.locator(consentSelector).first().click();
                    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
                }
            } catch (e) {
                // Ignore timeouts if no consent dialog
            }

            // Force English after redirect (short links may redirect without hl=en)
            let currentUrl = page.url();
            if (currentUrl.includes('google.com/maps') && !currentUrl.includes('hl=en')) {
                try {
                    const finalUrl = new URL(currentUrl);
                    finalUrl.searchParams.set('hl', 'en');
                    await logger.debug('Re-navigating with hl=en to force English...', 'API');
                    await page.goto(finalUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 15000 });
                    currentUrl = page.url();
                } catch (e) {
                    // Continue with current page
                }
            }

            // Handle SEARCH URLs - need to click through to the actual business
            // Search URLs look like: /maps/search/business+name/
            // Place URLs look like: /maps/place/Business+Name/
            if (currentUrl.includes('/maps/search/')) {
                await logger.info('Detected SEARCH URL - waiting for results and clicking first result...', 'API');
                try {
                    // Wait for search results to load
                    await page.waitForSelector('div[role="article"]', { timeout: 10000 });

                    // Click the first result to navigate to the place page
                    const firstResult = page.locator('div[role="article"] a[href*="/maps/place/"]').first();
                    if (await firstResult.isVisible({ timeout: 5000 })) {
                        await firstResult.click();
                        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
                        await logger.debug('Navigated to place page from search results.', 'API');
                    } else {
                        await logger.warn('No clickable result found in search results.', 'API');
                    }
                } catch (e: any) {
                    await logger.warn(`Failed to navigate from search to place: ${e.message}`, 'API');
                }
            }

            // Wait for the side panel header to appear (contains name)
            try {
                await page.waitForSelector('h1.DUwDvf', { timeout: 10000 });
            } catch (e) {
                await logger.warn('Title selector not found in time, attempting fallback extraction.', 'API');
            }

            // Extract details from the page
            const details = await page.evaluate(() => {
                // Common selectors for Business Name in the side panel
                const nameSelectors = ['h1.DUwDvf', 'h1 span', '.section-hero-header-title-title', '[role="main"] h1'];
                let name = '';
                for (const sel of nameSelectors) {
                    const el = document.querySelector(sel);
                    if (el?.textContent?.trim()) {
                        name = el.textContent.trim();
                        break;
                    }
                }

                // Common selectors for Address
                const addressEl = document.querySelector('button[data-item-id="address"] .Io6YTe, .L6Bbsf, [data-tooltip="Copy address"]');

                // Parse coordinates from URL
                const urlParts = window.location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                const lat = urlParts ? parseFloat(urlParts[1]) : null;
                const lng = urlParts ? parseFloat(urlParts[2]) : null;

                return {
                    name,
                    address: addressEl?.textContent?.trim() || '',
                    lat,
                    lng,
                    url: window.location.href
                };
            });

            if (!details.name) {
                // Absolute fallback: extract from page title
                const title = await page.title();
                details.name = title.split(' - Google Maps')[0].split(' - Google Search')[0].trim();
            }

            await logger.debug(`URL Lookup result: ${details.name} at ${details.lat},${details.lng}`, 'API');
            return NextResponse.json({ business: details });
        } else {
            // Search by query
            await logger.info(`Searching for business: ${query}`, 'API');
            await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}/?hl=en`, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            await page.waitForTimeout(2000);

            const results = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('div[role="article"]'));
                return items.slice(0, 5).map(item => {
                    const nameEl = item.querySelector('.fontHeadlineSmall, .qBF1Pd');
                    const addressEl = item.querySelector('.W4Pne, .Wvk9S');
                    const link = item.querySelector('a')?.href || '';

                    return {
                        name: nameEl?.textContent?.trim() || '',
                        address: addressEl?.textContent?.trim() || '',
                        url: link
                    };
                }).filter(r => r.name);
            });

            return NextResponse.json({ results });
        }

    } catch (error: any) {
        await logger.error(`Business lookup failed: ${error.message}`, 'API');
        return NextResponse.json({ error: 'Lookup failed', details: error.message }, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}
