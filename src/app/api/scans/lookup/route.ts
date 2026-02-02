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
        });
        const page = await context.newPage();

        if (url) {
            await logger.info(`Looking up business from URL: ${url}`, 'API');
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

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
