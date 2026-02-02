import { BrowserContext, Page } from 'playwright';
import { logger } from './logger';

export interface ScrapeResult {
    name: string;
    rating?: number;
    reviews?: number;
    address?: string;
    url?: string;
    rank: number;
}

export async function scrapeGMB(page: Page, keyword: string, lat: number, lng: number): Promise<ScrapeResult[]> {
    try {
        await logger.debug(`[Scraper] Navigating to Google Maps for "${keyword}" at ${lat},${lng}`, 'SCANNER');

        // Use a 30s timeout for the initial load, wait for domcontentloaded
        // If this fails, it's likely a dead proxy or a block
        try {
            await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${lat},${lng},14z/?hl=en`, {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });
        } catch (gotoError: any) {
            console.error(`[Scraper] Page goto failed: ${gotoError.message}`);
            throw gotoError; // Rethrow to be caught by the scanner's retry logic
        }

        // Wait for results to load - use multiple common selectors
        try {
            await page.waitForFunction(() => {
                return !!(document.querySelector('[role="article"]') ||
                    document.querySelector('.qBF1Pd') ||
                    document.querySelector('[role="feed"]'));
            }, { timeout: 20000 });
        } catch (e) {
            console.log('[Scraper] Warning: Standard result selectors not found, trying fallback extraction anyway.');
        }

        // Mimic human scrolling behavior
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => {
                const scrollable = document.querySelector('[role="feed"]') || document.body;
                scrollable.scrollBy(0, 800);
            });
            await page.waitForTimeout(1000 + Math.random() * 1000);
        }

        // Extract results with robust, multiple-path selectors
        // We use a self-invoking function string to avoid any transpilation artifacts like __name
        const results: ScrapeResult[] = await page.evaluate(() => {
            const extracted: any[] = [];

            // Priority 1: Articles with specific roles
            let items = Array.from(document.querySelectorAll('div[role="article"]'));

            // Priority 2: Links that look like place profiles
            if (items.length === 0) {
                const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
                items = links.map(l => l.closest('div') || l).filter(Boolean) as Element[];
            }

            const seenNames = new Set();

            items.forEach((item) => {
                if (extracted.length >= 20) return;

                let name = '';
                const ariaLabel = item.getAttribute('aria-label');
                if (ariaLabel && !ariaLabel.includes('stars') && ariaLabel.length > 2) {
                    name = ariaLabel;
                }

                // Strategy B: Specific class signatures
                if (!name) {
                    const nameEl = item.querySelector('.fontHeadlineSmall, .qBF1Pd, [role="heading"]');
                    name = nameEl?.textContent?.trim() || '';
                }

                if (!name || name.length < 2) return;
                name = name.split(' · ')[0].replace(/\. \d+$/, '').trim();

                if (seenNames.has(name.toLowerCase())) return;
                seenNames.add(name.toLowerCase());

                // URL/Link Extraction
                const linkEl = item.querySelector('a[href*="/maps/place/"]') || item.closest('a[href*="/maps/place/"]');
                const url = linkEl ? (linkEl as HTMLAnchorElement).href : '';

                // Rating & Reviews extraction
                const ratingEl = item.querySelector('[role="img"][aria-label*="stars"]');
                const ratingLabel = ratingEl?.getAttribute('aria-label') || '';
                const ratingMatch = ratingLabel.match(/([0-9.]+)\s+stars/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

                const reviewsMatch = ratingLabel.match(/\(([\d,]+)\)/) || ratingLabel.match(/([\d,]+)\s+reviews/);
                const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(/,/g, '')) : 0;

                const text = (item as HTMLElement).innerText || '';
                const lines = text.split('\n');
                const address = lines.find(l => l.match(/\d+/) && l !== name && l.length > 5) || '';

                extracted.push({
                    name,
                    rating,
                    reviews,
                    address: address.trim(),
                    url,
                    rank: extracted.length + 1
                });
            });

            return extracted;
        });

        await logger.debug(`[Scraper] Extracted ${results.length} entities.`, 'SCANNER');
        return results;

    } catch (error) {
        console.error(`[Scraper] Error scraping ${lat},${lng}:`, error);
        throw error; // Re-throw to trigger scanner's retry/rotation logic
    }
}
