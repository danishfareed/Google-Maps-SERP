import { NextResponse } from 'next/server';
import { launchChromium, getElectronLaunchDefaults } from '@/lib/browser';

/**
 * Preview a business from a Google Maps URL — fetches name, rating, total reviews
 * WITHOUT scraping all reviews. Used for the confirmation step.
 * 
 * CRITICAL: Google Maps is an SPA that never fires the standard 'load' or 
 * 'domcontentloaded' events when navigated to by Playwright. We use a 
 * fire-and-forget goto() and wait for specific content selectors instead.
 */
export async function POST(req: Request) {
    let browser = null;

    try {
        const body = await req.json();
        const url = body?.url;

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'Business URL is required' }, { status: 400 });
        }

        browser = await launchChromium({ headless: true, ...getElectronLaunchDefaults() });

        const context = await browser.newContext({
            viewport: { width: 1400, height: 900 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            locale: 'en-US',
            extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
            serviceWorkers: 'block',
        });

        // Pre-seed consent cookies to bypass Google consent screen
        await context.addCookies([
            { name: 'CONSENT', value: 'PENDING+987', domain: '.google.com', path: '/' },
            { name: 'SOCS', value: 'CAISHAgBEhJnd3NfMjAyMzA4MTUtMF9SQzIaAmVuIAEaBgiA_bSmBg', domain: '.google.com', path: '/' },
        ]);

        const page = await context.newPage();

        // Clean query params but DO NOT modify the data path (especially !9m1!1b1)
        // Stripping data segments breaks Google Maps' nested counter structure
        let targetUrl = url;
        try {
            const parsed = new URL(url);
            parsed.searchParams.set('hl', 'en');
            parsed.searchParams.set('gl', 'us');
            parsed.searchParams.delete('entry');
            parsed.searchParams.delete('g_ep');
            targetUrl = parsed.toString();
        } catch { /* use original */ }

        // FIRE-AND-FORGET: Google Maps never completes load/domcontentloaded events
        page.goto(targetUrl).catch(() => { });

        // Wait for business content to appear (any of these tells us the page is rendering)
        try {
            await page.waitForSelector('h1.DUwDvf, div.fontDisplayLarge, div[data-review-id], tr.BHOKXe', { timeout: 20000 });
        } catch { /* content might need more time */ }

        // Generous wait for the full SPA to hydrate — Google Maps renders
        // rating bars (tr.BHOKXe), review count, and business info progressively
        await page.waitForTimeout(10000);

        // Handle consent dialog if it appears
        try {
            const consentBtn = page.locator('button[aria-label="Accept all"], form[action*="consent"] button:last-child');
            if (await consentBtn.first().isVisible({ timeout: 2000 })) {
                await consentBtn.first().click();
                await page.waitForTimeout(3000);
            }
        } catch { /* no consent needed */ }

        // Extract basic business info
        const business = await page.evaluate(() => {
            // ---- Business Name ----
            let name = '';
            const nameEl = document.querySelector('h1.DUwDvf') ||
                document.querySelector('div.tAiQdd h1') ||
                document.querySelector('h1');
            if (nameEl) {
                name = nameEl.textContent?.trim() || '';
            }
            // Fallback: parse from page title "Business Name - Google Maps"
            if (!name) {
                const titleMatch = document.title.match(/^(.+?)\s*[-–]\s*Google Maps/);
                if (titleMatch) name = titleMatch[1].trim();
            }
            if (!name) name = 'Unknown Business';

            // ---- Rating ----
            let averageRating = 0;
            const ratingEl = document.querySelector('div.F7nice span[aria-hidden="true"]') ||
                document.querySelector('span.ceNzKf') ||
                document.querySelector('div.fontDisplayLarge');
            if (ratingEl) {
                averageRating = parseFloat(ratingEl.textContent?.replace(',', '.') || '0');
            }
            // Fallback: search body text for rating pattern like "4.3"
            if (averageRating === 0) {
                const bodyText = document.body?.innerText || '';
                const m = bodyText.match(/(\d\.\d)\s*(?:\([\d,]+\)|reviews)/i);
                if (m) averageRating = parseFloat(m[1]);
            }

            // ---- Total Reviews (3 approaches) ----
            let totalReviews = 0;

            // Approach 1: Sum from rating bar rows (tr.BHOKXe) — most reliable
            // e.g. "5 stars, 1,208 reviews"
            const rows = document.querySelectorAll('tr.BHOKXe[aria-label]');
            if (rows.length > 0) {
                let sum = 0;
                rows.forEach(row => {
                    const label = row.getAttribute('aria-label') || '';
                    const m = label.match(/([\d,]+)\s*review/i);
                    if (m) sum += parseInt(m[1].replace(/[^\d]/g, ''));
                });
                if (sum > 0) totalReviews = sum;
            }

            // Approach 2: div.F7nice parenthesized count "(1,799)"
            if (totalReviews === 0) {
                const f7nice = document.querySelector('div.F7nice');
                if (f7nice) {
                    const txt = f7nice.textContent || '';
                    const m = txt.match(/\(([\d,.\s]+)\)/);
                    if (m) {
                        const num = parseInt(m[1].replace(/[^\d]/g, ''));
                        if (num > 0 && num < 1000000) totalReviews = num;
                    }
                }
            }

            // Approach 3: Body text search "1,799 reviews"
            if (totalReviews === 0) {
                const bodyText = document.body?.innerText || '';
                const m = bodyText.match(/([\d,]+)\s+reviews/i);
                if (m) {
                    const num = parseInt(m[1].replace(/[^\d]/g, ''));
                    if (num > 10 && num < 1000000) totalReviews = num;
                }
            }

            // ---- Place ID ----
            let placeId = '';
            const placeMatch = window.location.href.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
            if (placeMatch) placeId = placeMatch[1];
            const cidMatch = window.location.href.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/);
            if (!placeId && cidMatch) placeId = cidMatch[1];

            // ---- Address ----
            const addressEl = document.querySelector('button[data-item-id="address"] div.fontBodyMedium, div.rogA2c div.Io6YTe');
            const address = addressEl?.textContent?.trim() || '';

            // ---- Category ----
            const categoryEl = document.querySelector('button.DkEaL, span.DkEaL');
            const category = categoryEl?.textContent?.trim() || '';

            return {
                name,
                averageRating,
                totalReviews,
                placeId: placeId || undefined,
                address,
                category,
            };
        });

        return NextResponse.json(business);

    } catch (error: any) {
        console.error('Preview error:', error);
        return NextResponse.json(
            { error: 'Failed to preview business. Please check the URL and try again.', details: error.message },
            { status: 500 }
        );
    } finally {
        if (browser) await browser.close();
    }
}
