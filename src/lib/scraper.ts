import { chromium, BrowserContext, Page } from 'playwright';

export interface ScrapeResult {
    name: string;
    rating?: number;
    reviews?: number;
    address?: string;
    rank: number;
}

export async function scrapeGMB(keyword: string, lat: number, lng: number): Promise<ScrapeResult[]> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: lat, longitude: lng });

    const page = await context.newPage();

    try {
        // Navigate to Google Maps
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${lat},${lng},14z/`, {
            waitUntil: 'networkidle',
            timeout: 60000,
        });

        // Wait for the results list to appear - try multiple possible selectors
        try {
            await page.waitForSelector('[role="feed"]', { timeout: 15000 });
        } catch (e) {
            console.log('Feed not found immediately, trying to interact...');
        }

        // Scroll to load more results (mimic user behavior)
        const feedSelector = '[role="feed"]';
        for (let i = 0; i < 4; i++) {
            const feed = await page.$(feedSelector);
            if (feed) {
                await feed.evaluate(node => node.scrollTop += 2000);
            }
            await page.waitForTimeout(1000 + Math.random() * 2000);
        }

        // Extract results using more generic structure assumptions
        const results: ScrapeResult[] = await page.evaluate(() => {
            // Helper to find text safely
            const getText = (el: Element | null) => el?.textContent?.trim() || '';

            const items = Array.from(document.querySelectorAll('div[role="article"]')); // often the main container for a result

            return items.slice(0, 20).map((item, index) => {
                // Name is usually in a specialized font style or heading
                const nameEl = item.querySelector('.fontHeadlineSmall') || item.querySelector('[aria-label]');
                const name = getText(nameEl) || (item.getAttribute('aria-label') || 'Unknown');

                // Rating often has aria-label "4.5 stars"
                const ratingEl = item.querySelector('[role="img"][aria-label*="stars"]') || item.querySelector('.fontBodyMedium span[role="img"]');
                const ratingLabel = ratingEl?.getAttribute('aria-label') || '';
                const ratingMatch = ratingLabel.match(/([0-9.]+)\s+stars/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

                // Reviews count often follows the rating
                const reviewsEl = item.querySelector('[aria-label*="reviews"]');
                const reviewsText = reviewsEl?.getAttribute('aria-label') || getText(reviewsEl);
                const reviews = reviewsText ? parseInt(reviewsText.replace(/[^0-9]/g, '')) : undefined;

                // Address is inconsistent, but often in the second line of text
                const container = item.closest('[jsaction]') || item;
                const textLines = (container as HTMLElement).innerText.split('\n');
                const address = textLines.length > 2 ? textLines.find(l => l.match(/\d+.*,.*\d+/)) || textLines[2] : '';

                return {
                    name: name.replace(/\. \d+$/, ''), // remove rank suffix if present
                    rating,
                    reviews,
                    address: address || '',
                    rank: index + 1,
                };
            });
        });

        return results;
    } catch (error) {
        console.error(`Scrape failed for ${lat},${lng}:`, error);
        return [];
    } finally {
        await browser.close();
    }
}
