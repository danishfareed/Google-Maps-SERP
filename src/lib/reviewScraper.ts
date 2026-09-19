import { Browser, Page, BrowserContext } from 'playwright-core';
import { launchChromium, getElectronLaunchDefaults } from './browser';
import { logger } from './logger';

export interface ScrapedReview {
    reviewId?: string;
    reviewerName: string;
    reviewerUrl?: string;
    reviewImage?: string;
    reviewCount?: number;
    photoCount?: number;
    rating: number;
    text?: string;
    publishedDate?: string;
    responseText?: string;
    responseDate?: string;
}

export interface ScrapedBusinessInfo {
    name: string;
    averageRating: number;
    totalReviews: number;
    placeId?: string;
}

/**
 * Scrapes all Google reviews for a business from its Google Maps URL.
 * 
 * CRITICAL: Google Maps is an SPA that never fires standard 'load' or 
 * 'domcontentloaded' events. We use fire-and-forget goto() and wait 
 * for specific content selectors instead.
 */
export async function scrapeGoogleReviews(
    businessUrl: string,
    onProgress?: (msg: string) => void
): Promise<{ business: ScrapedBusinessInfo; reviews: ScrapedReview[] }> {
    let browser: Browser | null = null;

    const log = (msg: string) => {
        onProgress?.(msg);
        logger.info(msg, 'REVIEW_SCRAPER');
    };

    try {
        log('Launching browser...');
        browser = await launchChromium({ headless: true, ...getElectronLaunchDefaults() });

        const context = await browser.newContext({
            viewport: { width: 1400, height: 900 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            locale: 'en-US',
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
            },
            serviceWorkers: 'block',
        });

        // Pre-seed consent cookies to bypass Google consent screen
        await context.addCookies([
            { name: 'CONSENT', value: 'PENDING+987', domain: '.google.com', path: '/' },
            { name: 'SOCS', value: 'CAISHAgBEhJnd3NfMjAyMzA4MTUtMF9SQzIaAmVuIAEaBgiA_bSmBg', domain: '.google.com', path: '/' },
        ]);

        const page = await context.newPage();

        // Clean query params but DO NOT modify the data path
        // (stripping !9m1!1b1 etc breaks Google's data structure)
        let targetUrl = businessUrl;
        try {
            const parsed = new URL(businessUrl);
            parsed.searchParams.set('hl', 'en');
            parsed.searchParams.set('gl', 'us');
            parsed.searchParams.delete('entry');
            parsed.searchParams.delete('g_ep');
            targetUrl = parsed.toString();
        } catch { /* use original */ }

        // Retry wrapper — attempt up to 3 times with full re-navigation
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                if (attempt > 1) {
                    log(`Retry attempt ${attempt}/3...`);
                    await page.waitForTimeout(3000);
                }

                log('Navigating to business page...');

                // FIRE-AND-FORGET: Google Maps never fires load/domcontentloaded 
                page.goto(targetUrl).catch(() => { });

                // Wait for business content to appear
                log('Waiting for business panel to render...');
                try {
                    await page.waitForSelector('h1.DUwDvf, div.fontDisplayLarge, div[data-review-id], tr.BHOKXe', { timeout: 20000 });
                } catch {
                    log('Selectors not found — waiting longer...');
                }

                // Extra wait for SPA to fully hydrate
                await page.waitForTimeout(5000);

                // Handle consent dialog if it appears
                try {
                    const consentBtn = page.locator('button[aria-label="Accept all"], form[action*="consent"] button:last-child');
                    if (await consentBtn.first().isVisible({ timeout: 2000 })) {
                        await consentBtn.first().click();
                        await page.waitForTimeout(3000);
                    }
                } catch { /* no consent needed */ }

                // Extract business info
                log('Extracting business info...');
                let business = await extractBusinessInfo(page);
                log(`Found: "${business.name}", ${business.averageRating}★, ${business.totalReviews} reviews`);

                // If totalReviews is 0, try harder
                if (business.totalReviews === 0) {
                    log('⚠️ totalReviews is 0 — waiting for full render...');
                    await page.waitForTimeout(5000);
                    business = await extractBusinessInfo(page);
                    log(`Re-extracted: "${business.name}", ${business.averageRating}★, ${business.totalReviews} reviews`);
                }

                // Ensure we're on the Reviews tab for scraping
                log('Opening reviews tab...');
                await openReviewsTab(page);

                // Wait for review elements to appear after clicking the tab
                log('Waiting for review elements to load...');
                try {
                    await page.waitForSelector('div[data-review-id], div.jftiEf', { timeout: 15000 });
                    log('Review elements detected.');
                } catch {
                    log('Review elements not found via waitForSelector — trying extra wait...');
                    await page.waitForTimeout(5000);
                }

                // Sort by newest to get chronological data
                log('Sorting reviews by newest...');
                await sortReviewsByNewest(page);

                // Select "All languages" to capture reviews in every language
                log('Selecting all languages filter...');
                await selectAllLanguages(page, log);

                // Verify we can see review elements
                await page.waitForTimeout(2000);
                const initialCount = await page.evaluate(() => {
                    const withId = document.querySelectorAll('div[data-review-id]');
                    if (withId.length > 0) {
                        const uniqueIds = new Set<string>();
                        withId.forEach(el => {
                            const id = el.getAttribute('data-review-id');
                            if (id) uniqueIds.add(id);
                        });
                        return uniqueIds.size;
                    }
                    return document.querySelectorAll('div.jftiEf, div.jJc9Ad').length;
                });
                log(`Review elements visible: ${initialCount}`);

                if (initialCount === 0) {
                    const debugInfo = await page.evaluate(() => ({
                        title: document.title,
                        h1: document.querySelector('h1')?.textContent || 'none',
                        bodyLen: document.body?.innerHTML?.length || 0,
                        tabCount: document.querySelectorAll('button[role="tab"]').length,
                        scrollContainer: !!document.querySelector('div.m6QErb'),
                    }));
                    log(`Debug: title="${debugInfo.title}", h1="${debugInfo.h1}", bodyLen=${debugInfo.bodyLen}, tabs=${debugInfo.tabCount}, scrollContainer=${debugInfo.scrollContainer}`);
                    throw new Error(`No review elements found (attempt ${attempt})`);
                }

                // Scroll and collect all reviews
                const target = business.totalReviews || 100;
                log(`Scrolling to load all ${target} reviews (this may take a while)...`);
                const reviews = await scrollAndCollectReviews(page, target, log);

                if (reviews.length === 0) {
                    throw new Error('Scraped 0 reviews — DOM selectors may have changed');
                }

                log(`✅ Successfully scraped ${reviews.length} reviews for "${business.name}"`);
                return { business, reviews };

            } catch (err: any) {
                lastError = err;
                log(`Attempt ${attempt} failed: ${err.message}`);
                if (attempt >= 3) break;
            }
        }

        throw lastError || new Error('Failed to scrape reviews after retries');

    } finally {
        if (browser) await browser.close();
    }
}

async function extractBusinessInfo(page: Page): Promise<ScrapedBusinessInfo> {
    return await page.evaluate(() => {
        // ---- Business Name (multiple fallbacks) ----
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
        // Fallback: search body text
        if (averageRating === 0) {
            const bodyText = document.body?.innerText || '';
            const m = bodyText.match(/(\d\.\d)\s*(?:\([\d,]+\)|reviews)/i);
            if (m) averageRating = parseFloat(m[1]);
        }

        // ---- Total Reviews (3 approaches) ----
        let totalReviews = 0;

        // Approach 1: Sum from rating bar rows (tr.BHOKXe) — MOST RELIABLE
        // Works on both Overview and Reviews tabs
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

        // ---- Place ID from URL ----
        let placeId = '';
        const placeMatch = window.location.href.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
        if (placeMatch) placeId = placeMatch[1];
        const cidMatch = window.location.href.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/);
        if (!placeId && cidMatch) placeId = cidMatch[1];

        return { name, averageRating, totalReviews, placeId: placeId || undefined };
    });
}

async function openReviewsTab(page: Page): Promise<void> {
    // Try clicking the reviews tab button — multiple approaches
    try {
        const reviewTab = page.locator('button[aria-label*="Reviews"], button[aria-label*="reviews"], button[data-tab-id="reviews"]');
        if (await reviewTab.first().isVisible({ timeout: 3000 })) {
            await reviewTab.first().click();
            await page.waitForTimeout(2000);
            return;
        }
    } catch { /* fallback below */ }

    // Fallback 1: Try all tab buttons and find one with "review" text
    try {
        const tabs = page.locator('button[role="tab"]');
        const count = await tabs.count();
        for (let i = 0; i < count; i++) {
            const text = await tabs.nth(i).textContent() || '';
            const label = await tabs.nth(i).getAttribute('aria-label') || '';
            if (text.toLowerCase().includes('review') || label.toLowerCase().includes('review')) {
                await tabs.nth(i).click();
                await page.waitForTimeout(2000);
                return;
            }
        }
        // If no match found, just click the 2nd or 3rd tab
        if (count >= 2) {
            await tabs.nth(count >= 3 ? 2 : 1).click();
            await page.waitForTimeout(2000);
            return;
        }
    } catch { /* fallback below */ }

    // Fallback 2: click on the review count text
    try {
        const reviewLink = page.locator('span[aria-label*="review"], span[aria-label*="Review"]').first();
        if (await reviewLink.isVisible({ timeout: 3000 })) {
            await reviewLink.click();
            await page.waitForTimeout(2000);
        }
    } catch { /* reviews may already be visible */ }
}

async function sortReviewsByNewest(page: Page): Promise<void> {
    try {
        // Click the sort button
        const sortBtn = page.locator('button[aria-label="Sort reviews"], button[data-value="Sort"]');
        if (await sortBtn.first().isVisible({ timeout: 5000 })) {
            await sortBtn.first().click();
            await page.waitForTimeout(1000);

            // Click "Newest"
            const newestOption = page.locator('div[role="menuitemradio"]:has-text("Newest"), li[data-index="1"]');
            if (await newestOption.first().isVisible({ timeout: 3000 })) {
                await newestOption.first().click();
                await page.waitForTimeout(2000);
            }
        }
    } catch {
        // Continue without sorting — default "Most Relevant" is still usable
    }
}

/**
 * Select "All languages" in the review language filter.
 * Google Maps defaults to showing only the user's browser language.
 * The total review count includes ALL languages, so we must switch
 * to "All languages" to scrape the complete set.
 */
async function selectAllLanguages(page: Page, log: (msg: string) => void): Promise<void> {
    try {
        // Strategy 1: Look for the language filter dropdown button
        // On Google Maps, it appears as a button with text like "English (650)" or similar
        // near the sort button area, OR as a separate dropdown

        // Try: button with aria-label containing "language" or "Language"
        let filterClicked = false;

        // Method A: Look for a dropdown/select that contains language options
        const langButtons = page.locator('button[aria-label*="language"], button[aria-label*="Language"]');
        if (await langButtons.first().isVisible({ timeout: 2000 })) {
            await langButtons.first().click();
            await page.waitForTimeout(1000);
            filterClicked = true;
        }

        // Method B: Look for a button near reviews that contains a language name pattern
        if (!filterClicked) {
            const allButtons = page.locator('button.HQzyZ, button.e2moi');
            const count = await allButtons.count();
            for (let i = 0; i < count; i++) {
                const text = await allButtons.nth(i).textContent() || '';
                // Language filter buttons typically show "English (N)" or similar
                if (text.match(/\w+\s*\(\d+\)/)) {
                    await allButtons.nth(i).click();
                    await page.waitForTimeout(1000);
                    filterClicked = true;
                    break;
                }
            }
        }

        // Method C: Try clicking any element that looks like it filters by language
        if (!filterClicked) {
            const filterBtns = page.locator('div.m6QErb button, div.F7nice ~ button, div.jANrlb button');
            const count = await filterBtns.count();
            for (let i = 0; i < Math.min(count, 10); i++) {
                const text = await filterBtns.nth(i).textContent() || '';
                const label = await filterBtns.nth(i).getAttribute('aria-label') || '';
                if (text.match(/english|all\s*lang|language/i) || label.match(/language/i) || text.match(/\w+\s*\(\d{2,}\)/)) {
                    await filterBtns.nth(i).click();
                    await page.waitForTimeout(1000);
                    filterClicked = true;
                    break;
                }
            }
        }

        if (!filterClicked) {
            log('No language filter found — may already show all languages');
            return;
        }

        // Now select "All languages" from the dropdown/menu
        // Try multiple patterns for the "All languages" option
        const allLangOption = page.locator(
            'div[role="menuitemradio"]:has-text("All"), ' +
            'div[role="option"]:has-text("All"), ' +
            'li:has-text("All languages"), ' +
            'div[role="menuitemradio"]:first-child'
        );

        if (await allLangOption.first().isVisible({ timeout: 3000 })) {
            await allLangOption.first().click();
            await page.waitForTimeout(3000); // Wait for reviews to reload
            log('✅ Selected "All languages" filter');
        } else {
            // Maybe it's a checkbox-style filter at the top of reviews
            // Try clicking text that says "All" near the language area
            const allText = page.locator('span:has-text("All languages"), button:has-text("All languages"), div:has-text("All languages")').first();
            if (await allText.isVisible({ timeout: 2000 })) {
                await allText.click();
                await page.waitForTimeout(3000);
                log('✅ Clicked "All languages" text element');
            } else {
                log('⚠️ Could not find "All languages" option');
            }
        }
    } catch (e: any) {
        log(`Language filter selection failed: ${e.message} — continuing anyway`);
    }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * NETWORK INTERCEPTION PARSER
 * ═══════════════════════════════════════════════════════════════
 * Google Maps loads reviews via XHR requests. The response body
 * starts with ")]}'" followed by a nested JSON array.
 * Reviews are embedded deep in this structure.
 * 
 * This parser extracts reviews directly from the API payload —
 * no DOM parsing needed (faster, more reliable, doesn't break
 * when Google changes CSS class names).
 * ═══════════════════════════════════════════════════════════════
 */

function parseReviewsFromNetworkResponse(body: string): { reviews: ScrapedReview[], nextPageToken: string | null } {
    const reviews: ScrapedReview[] = [];
    let nextPageToken: string | null = null;

    try {
        // Google prepends ")]}'" or similar safety prefix to JSON responses
        let jsonStr = body;
        const prefixMatch = jsonStr.match(/^\)?\]?\}?'?\s*\n?/);
        if (prefixMatch) {
            jsonStr = jsonStr.slice(prefixMatch[0].length);
        }
        // Also try stripping common Google API prefixes
        if (jsonStr.startsWith(")]}'")) {
            jsonStr = jsonStr.slice(4);
        } else if (jsonStr.startsWith(")]}'\\n")) {
            jsonStr = jsonStr.slice(5);
        }

        const data = JSON.parse(jsonStr);

        // The response is a deeply nested array. We need to find review entries.
        // Strategy: recursively search for arrays that look like review data.
        // A review entry typically has a structure with rating (1-5), text, name, date.

        const extractedReviews = findReviewsInNestedArray(data);
        reviews.push(...extractedReviews);

        // Try to find the pagination token — it's usually a base64-like string
        // deep in the response that changes between pages
        nextPageToken = findPaginationToken(data);

    } catch (e) {
        // Not a valid review response — ignore
    }

    return { reviews, nextPageToken };
}

/**
 * Recursively search a deeply nested Google Maps API response for review data.
 * Reviews in the wire format typically appear as arrays where:
 * - One element is a sub-array containing reviewer name
 * - One element is the rating (number 1-5)
 * - One element is the review text
 * - One element is a date string
 */
function findReviewsInNestedArray(data: any): ScrapedReview[] {
    const reviews: ScrapedReview[] = [];

    if (!data || typeof data !== 'object') return reviews;

    // If this is an array, check if it looks like a review entry
    if (Array.isArray(data)) {
        const review = tryExtractReviewFromArray(data);
        if (review) {
            reviews.push(review);
            return reviews; // Don't recurse into a found review
        }

        // Otherwise recurse into each element
        for (const item of data) {
            reviews.push(...findReviewsInNestedArray(item));
        }
    }

    return reviews;
}

/**
 * Try to interpret a nested array as a single Google Maps review.
 * The structure varies but core patterns are consistent:
 * 
 * The review array typically has these characteristics at specific indices:
 * - Contains a sub-array with a string (reviewer name) and a URL-like string (profile)
 * - Contains a number 1-5 (rating)
 * - Contains a string (review text)
 * - Contains a string matching date patterns (e.g., "2 months ago", "a year ago")
 */
function tryExtractReviewFromArray(arr: any[]): ScrapedReview | null {
    if (!Array.isArray(arr) || arr.length < 3) return null;

    try {
        // Pattern 1: Standard web response format
        // [reviewId, [name, profileUrl, ...], rating, text, timestamp, ...]
        // We look for arrays that have:
        // - A string that starts with "ChZ" or similar (review ID)
        // - A sub-array containing a name string
        // - An integer 1-5 (rating)

        let reviewId: string | undefined;
        let reviewerName = 'Anonymous';
        let reviewerUrl: string | undefined;
        let reviewImage: string | undefined;
        let reviewCount: number | undefined;
        let photoCount: number | undefined;
        let rating = 0;
        let text: string | undefined;
        let publishedDate: string | undefined;
        let responseText: string | undefined;
        let responseDate: string | undefined;

        // Check if first element is a string (review ID)
        if (typeof arr[0] === 'string' && arr[0].length > 5) {
            reviewId = arr[0];
        }

        // Look for the reviewer info sub-array
        // It's usually an array that contains the reviewer name as a string
        // and may have a URL and photo URL
        for (const item of arr) {
            if (Array.isArray(item) && item.length >= 1) {
                // Check if this sub-array has a name (string), possibly nested
                if (typeof item[0] === 'string' && item[0].length > 0 && item[0].length < 100) {
                    // Could be reviewer name
                    if (!reviewerName || reviewerName === 'Anonymous') {
                        // But skip if it looks like a date string or review text
                        if (!item[0].match(/ago|year|month|week|day|hour|minute/i) && item[0].length < 50) {
                            reviewerName = item[0];
                        }
                    }
                }
                // Look for profile URL
                if (typeof item[1] === 'string' && item[1].includes('contrib')) {
                    reviewerUrl = item[1];
                }
                // Look for profile image URL
                if (typeof item[0] === 'string' && item[0].includes('googleusercontent.com')) {
                    reviewImage = item[0];
                } else if (typeof item[1] === 'string' && item[1]?.includes('googleusercontent.com')) {
                    reviewImage = item[1];
                }
                // Look for reviewer stats (review count, photo count)
                if (Array.isArray(item)) {
                    for (const sub of item) {
                        if (typeof sub === 'string') {
                            const rcMatch = sub.match(/(\d+)\s*reviews?/i);
                            if (rcMatch) reviewCount = parseInt(rcMatch[1]);
                            const pcMatch = sub.match(/(\d+)\s*photos?/i);
                            if (pcMatch) photoCount = parseInt(pcMatch[1]);
                        }
                    }
                }
            }
        }

        // Look for rating (integer 1-5)
        for (const item of arr) {
            if (typeof item === 'number' && item >= 1 && item <= 5 && Number.isInteger(item)) {
                rating = item;
                break;
            }
        }

        // Look for review text (long string, not a URL/ID)
        for (const item of arr) {
            if (typeof item === 'string' && item.length > 10 && !item.includes('http') && !item.startsWith('Ch')) {
                if (!text) text = item;
            }
            // Also check nested arrays for text
            if (Array.isArray(item)) {
                for (const sub of item) {
                    if (typeof sub === 'string' && sub.length > 20 && !sub.includes('http') && !sub.startsWith('Ch')) {
                        if (!text) text = sub;
                    }
                }
            }
        }

        // Look for date string  
        for (const item of arr) {
            if (typeof item === 'string' && item.match(/\d+\s*(day|week|month|year|hour|minute)s?\s*ago/i)) {
                publishedDate = item;
                break;
            }
            if (Array.isArray(item)) {
                for (const sub of item) {
                    if (typeof sub === 'string' && sub.match(/\d+\s*(day|week|month|year|hour|minute)s?\s*ago/i)) {
                        if (!publishedDate) publishedDate = sub;
                    }
                }
            }
        }

        // Look for owner response (usually in a nested array near the end)
        for (const item of arr) {
            if (Array.isArray(item) && item.length >= 2) {
                for (const sub of item) {
                    if (Array.isArray(sub) && sub.length >= 2) {
                        // Owner response pattern: [responseText, responseTimestamp, ...]
                        if (typeof sub[0] === 'string' && sub[0].length > 10 && !sub[0].includes('http')) {
                            if (text && sub[0] !== text) {
                                responseText = sub[0];
                                if (typeof sub[1] === 'string' && sub[1].match(/\d+\s*(day|week|month|year)s?\s*ago/i)) {
                                    responseDate = sub[1];
                                }
                            }
                        }
                    }
                }
            }
        }

        // Only return if we found at minimum a rating
        if (rating > 0) {
            return {
                reviewId,
                reviewerName,
                reviewerUrl,
                reviewImage,
                reviewCount,
                photoCount,
                rating,
                text,
                publishedDate,
                responseText,
                responseDate,
            };
        }
    } catch {
        // Not a review
    }

    return null;
}

/**
 * Find a pagination token in the nested response array.
 * Pagination tokens are typically base64-encoded strings
 * that appear near the end of the response.
 */
function findPaginationToken(data: any): string | null {
    if (!data || typeof data !== 'object') return null;

    if (typeof data === 'string') {
        // Pagination tokens are typically long base64 strings
        if (data.length > 20 && data.length < 500 && /^[A-Za-z0-9+/=_-]+$/.test(data)) {
            // Extra check: should not be a URL or known field
            if (!data.includes('http') && !data.startsWith('Ch') && !data.includes('google')) {
                return data;
            }
        }
        return null;
    }

    if (Array.isArray(data)) {
        // Search from the end (tokens usually at the end of the response)
        for (let i = data.length - 1; i >= 0; i--) {
            const token = findPaginationToken(data[i]);
            if (token) return token;
        }
    }

    return null;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HYBRID REVIEW COLLECTOR
 * ═══════════════════════════════════════════════════════════════
 * Two collection streams run in parallel:
 * 1. Network interception — captures reviews from XHR responses
 * 2. DOM scrolling — triggers network requests + serves as fallback
 * 
 * At the end, we merge both sources and deduplicate.
 * ═══════════════════════════════════════════════════════════════
 */
async function scrollAndCollectReviews(
    page: Page,
    expectedTotal: number,
    log: (msg: string) => void
): Promise<ScrapedReview[]> {
    const startTime = Date.now();
    // Adaptive timeout: 45 min for small, 90 min for 500+, 120 min for 1000+
    const GLOBAL_TIMEOUT_MS = expectedTotal > 1000
        ? 120 * 60 * 1000
        : expectedTotal > 500
            ? 90 * 60 * 1000
            : 45 * 60 * 1000;

    // ═══ STREAM 1: Network Interception ═══
    const networkReviews = new Map<string, ScrapedReview>();
    let lastPageToken: string | null = null;
    let networkResponseCount = 0;

    // Listen for all XHR responses that might contain review data
    page.on('response', async (response) => {
        try {
            const url = response.url();
            const status = response.status();

            // Only process successful responses from Google domains
            if (status !== 200) return;
            if (!url.includes('google.com') && !url.includes('googleapis.com')) return;

            // Filter for likely review-containing responses
            // Google Maps review XHRs match these patterns:
            const isReviewResponse =
                url.includes('listentitiesreviews') ||
                url.includes('listugcposts') ||
                url.includes('preview/review') ||
                url.includes('maps/rpc') ||
                (url.includes('batchexecute') && url.includes('google.com'));

            if (!isReviewResponse) return;

            const contentType = response.headers()['content-type'] || '';
            if (!contentType.includes('application/json') && !contentType.includes('text/html') && !contentType.includes('application/x-protobuf')) {
                // Also try text/* responses since Google sometimes returns text/plain
                if (!contentType.includes('text/')) return;
            }

            const body = await response.text();
            if (body.length < 50) return; // Too short to contain review data

            const { reviews, nextPageToken } = parseReviewsFromNetworkResponse(body);

            if (reviews.length > 0) {
                networkResponseCount++;
                for (const review of reviews) {
                    const key = review.reviewId || `${review.reviewerName}-${review.rating}-${(review.text || '').slice(0, 30)}`;
                    networkReviews.set(key, review);
                }
                if (nextPageToken) {
                    lastPageToken = nextPageToken;
                }
            }
        } catch {
            // Response parsing failed — ignore and continue
        }
    });

    // ═══ STREAM 2: DOM Scrolling (triggers network requests) ═══
    const maxScrollAttempts = Math.min(expectedTotal * 5, 8000);
    let lastDOMCount = 0;
    let lastNetworkCount = 0;
    let noNewCount = 0;
    let lastLoggedCount = 0;

    const getScrollDelay = (loaded: number): number => {
        // Faster delays — we primarily trigger network requests, DOM is secondary
        let base: number;
        if (loaded < 100) base = 600;
        else if (loaded < 300) base = 800;
        else if (loaded < 500) base = 1000;
        else if (loaded < 1000) base = 1200;
        else base = 1500; // Was 2500 — too slow for 1k+ reviews
        return base + Math.floor(Math.random() * 400) - 200;
    };

    const getScrollDistance = (): number => 1200 + Math.floor(Math.random() * 1200);

    const countReviewsInDOM = async (): Promise<number> => {
        return page.evaluate(() => {
            const withId = document.querySelectorAll('div[data-review-id]');
            if (withId.length > 0) {
                const ids = new Set<string>();
                withId.forEach(el => { const id = el.getAttribute('data-review-id'); if (id) ids.add(id); });
                return ids.size;
            }
            return document.querySelectorAll('div.jftiEf, div.jJc9Ad').length;
        });
    };

    const findScrollContainer = async (): Promise<string> => {
        return page.evaluate(() => {
            const candidates = ['div.m6QErb.DxyBCb.kA9KIf.dS8AEf', 'div.m6QErb.DxyBCb', 'div.m6QErb'];
            for (const sel of candidates) {
                const el = document.querySelector(sel);
                if (el && el.scrollHeight > el.clientHeight) return sel;
            }
            const reviewEl = document.querySelector('div[data-review-id]');
            if (reviewEl) {
                let parent = reviewEl.parentElement;
                for (let i = 0; i < 10 && parent; i++) {
                    if (parent.scrollHeight > parent.clientHeight + 100) {
                        parent.id = parent.id || '__review_scroll_container';
                        return `#${parent.id}`;
                    }
                    parent = parent.parentElement;
                }
            }
            return 'div.m6QErb.DxyBCb';
        });
    };

    const expandMoreButtons = async () => {
        await page.evaluate(() => {
            ['button.w8nwRe.kyuRq', 'button.w8nwRe', 'span.w8nwRe'].forEach(sel => {
                document.querySelectorAll(sel).forEach(btn => {
                    const t = btn.textContent?.trim().toLowerCase() || '';
                    if (t.includes('more') || t.includes('see more')) (btn as HTMLElement).click();
                });
            });
        });
    };

    log(`🔍 Starting hybrid collection (network interception + DOM scrolling)...`);

    for (let i = 0; i < maxScrollAttempts; i++) {
        if (Date.now() - startTime > GLOBAL_TIMEOUT_MS) {
            log(`⚠️ Global timeout (${Math.round(GLOBAL_TIMEOUT_MS / 60000)} min). Network: ${networkReviews.size}, DOM: ${lastDOMCount}`);
            break;
        }

        const selector = await findScrollContainer();
        const dist = getScrollDistance();

        // Scroll strategy: alternate between incremental and full
        if (i % 4 === 3) {
            await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                if (el) el.scrollTop = el.scrollHeight;
            }, selector);
        } else {
            await page.evaluate(({ sel, d }) => {
                const el = document.querySelector(sel);
                if (el) el.scrollTop += d;
            }, { sel: selector, d: dist });
        }

        // Wait for network + DOM
        try { await page.waitForLoadState('networkidle', { timeout: 2000 }); } catch { }
        await page.waitForTimeout(getScrollDelay(Math.max(lastDOMCount, networkReviews.size)));

        // Expand "More" buttons periodically
        if (i % 4 === 0) await expandMoreButtons();

        // Proactively click "Load More" button every 8 cycles (Google shows this for large lists)
        if (i % 8 === 7) {
            await page.evaluate(() => {
                const btn = document.querySelector('button.HzLjNd, button[jsaction*="pane.review-list"], button[aria-label*="more reviews"], button[aria-label*="More reviews"]');
                if (btn) (btn as HTMLElement).click();
            });
        }

        // Count DOM reviews
        const domCount = await countReviewsInDOM();
        const totalCollected = Math.max(domCount, networkReviews.size);

        // Progress logging
        if (i % 4 === 0 || (totalCollected - lastLoggedCount >= 20)) {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            const rate = elapsed > 0 ? Math.round((totalCollected / elapsed) * 60) : 0;
            log(`📊 Network: ${networkReviews.size} | DOM: ${domCount} / ~${expectedTotal} (${elapsed}s, ~${rate}/min)`);
            lastLoggedCount = totalCollected;
        }

        // Stall detection — both DOM and network must be stalled
        const currentNetworkCount = networkReviews.size;
        if (domCount === lastDOMCount && currentNetworkCount === lastNetworkCount) {
            noNewCount++;

            // Phase 1: Jiggle scroll
            if (noNewCount >= 4 && noNewCount < 10) {
                await page.evaluate(({ sel }) => {
                    const el = document.querySelector(sel);
                    if (el) el.scrollTop -= Math.floor(el.scrollHeight * 0.3);
                }, { sel: selector });
                await page.waitForTimeout(1500);
                for (let s = 0; s < 3; s++) {
                    await page.evaluate(({ sel, d }) => {
                        const el = document.querySelector(sel);
                        if (el) el.scrollTop += d;
                    }, { sel: selector, d: getScrollDistance() });
                    await page.waitForTimeout(800);
                }
            }

            // Phase 2: Full scroll + load more
            if (noNewCount >= 10 && noNewCount < 20) {
                await page.evaluate((sel) => {
                    const el = document.querySelector(sel); if (el) el.scrollTop = el.scrollHeight;
                }, selector);
                await page.waitForTimeout(3000);
                await page.evaluate(() => {
                    const btn = document.querySelector('button.HzLjNd, button[jsaction*="pane.review-list"]');
                    if (btn) (btn as HTMLElement).click();
                });
                await page.waitForTimeout(2000);
            }

            // Phase 3: Sort toggle (every 20 stalls)
            if (noNewCount > 0 && noNewCount % 20 === 0) {
                log(`⚙️ Stalled at ${totalCollected}. Sort-toggle recovery #${Math.floor(noNewCount / 20)}...`);
                try {
                    const sortBtn = page.locator('button[aria-label="Sort reviews"], button[data-value="Sort"]');
                    if (await sortBtn.first().isVisible({ timeout: 2000 })) {
                        await sortBtn.first().click();
                        await page.waitForTimeout(1500);
                        const opt = page.locator('div[role="menuitemradio"]').first();
                        if (await opt.isVisible({ timeout: 2000 })) {
                            await opt.click();
                            await page.waitForTimeout(3000);
                        }
                        await sortBtn.first().click();
                        await page.waitForTimeout(1500);
                        const newest = page.locator('div[role="menuitemradio"]:has-text("Newest"), li[data-index="1"]');
                        if (await newest.first().isVisible({ timeout: 2000 })) {
                            await newest.first().click();
                            await page.waitForTimeout(3000);
                        }
                    }
                } catch { }

                // Full top-to-bottom sweep
                await page.evaluate((sel) => {
                    const el = document.querySelector(sel); if (el) el.scrollTop = 0;
                }, selector);
                await page.waitForTimeout(1500);
                for (let s = 0; s < 5; s++) {
                    await page.evaluate(({ sel, d }) => {
                        const el = document.querySelector(sel); if (el) el.scrollTop += d;
                    }, { sel: selector, d: getScrollDistance() });
                    await page.waitForTimeout(1000);
                }
            }

            // Stall limit — more aggressive since we have network data too
            let stallLimit: number;
            if (expectedTotal > 1000) stallLimit = 150;
            else if (expectedTotal > 500) stallLimit = 100;
            else if (expectedTotal > 200) stallLimit = 60;
            else stallLimit = 40;

            if (noNewCount > stallLimit) {
                const pct = expectedTotal > 0 ? Math.round((totalCollected / expectedTotal) * 100) : 0;
                log(`⚠️ Stall limit. Network: ${networkReviews.size}, DOM: ${domCount}/${expectedTotal} (${pct}%)`);
                break;
            }
        } else {
            noNewCount = 0;
        }
        lastDOMCount = domCount;
        lastNetworkCount = currentNetworkCount;

        // Completion check (use max of both sources)
        if (totalCollected >= expectedTotal) {
            log(`✅ Target reached! Network: ${networkReviews.size}, DOM: ${domCount}`);
            break;
        }
    }

    // ═══ EXTRACTION: Merge network + DOM data ═══
    log(`📥 Collection complete. Network captured: ${networkReviews.size} reviews (from ${networkResponseCount} responses)`);

    // Always extract from DOM too (it may have data network missed, especially owner responses)
    log('Extracting review data from DOM (fallback + enrichment)...');
    const domReviews = await extractReviewsFromDOM(page);
    log(`DOM extracted: ${domReviews.length} reviews`);

    // Merge: prefer DOM data for matching reviews (better owner response + "More" text),
    // but use network data for any reviews DOM missed
    const mergedMap = new Map<string, ScrapedReview>();

    // First add DOM reviews (higher quality for owner responses)
    for (const r of domReviews) {
        const key = r.reviewId || `${r.reviewerName}-${r.rating}-${(r.text || '').slice(0, 30)}`;
        mergedMap.set(key, r);
    }

    // Then add network reviews for any we missed in DOM
    let networkOnlyCount = 0;
    for (const [key, r] of networkReviews) {
        if (!mergedMap.has(key)) {
            mergedMap.set(key, r);
            networkOnlyCount++;
        }
    }

    if (networkOnlyCount > 0) {
        log(`🔗 Merged: ${domReviews.length} DOM + ${networkOnlyCount} network-only = ${mergedMap.size} total`);
    }

    const finalReviews = Array.from(mergedMap.values());
    log(`✅ Final review count: ${finalReviews.length} / ~${expectedTotal} (${expectedTotal > 0 ? Math.round((finalReviews.length / expectedTotal) * 100) : 0}%)`);

    return finalReviews;
}

/**
 * Extract reviews from the DOM (original approach, now used as fallback/enrichment)
 */
async function extractReviewsFromDOM(page: Page): Promise<ScrapedReview[]> {
    // Expand all "More" buttons first
    await page.evaluate(() => {
        ['button.w8nwRe.kyuRq', 'button.w8nwRe', 'span.w8nwRe'].forEach(sel => {
            document.querySelectorAll(sel).forEach(btn => {
                const t = btn.textContent?.trim().toLowerCase() || '';
                if (t.includes('more') || t.includes('see more')) (btn as HTMLElement).click();
            });
        });
    });
    await page.waitForTimeout(500);

    const rawReviews = await page.evaluate(() => {
        const withId = document.querySelectorAll('div[data-review-id]');
        let reviewElements: Element[];

        if (withId.length > 0) {
            const outermost: Element[] = [];
            const seenIds = new Set<string>();
            withId.forEach(el => {
                const id = el.getAttribute('data-review-id') || '';
                let parent = el.parentElement;
                let isNested = false;
                while (parent) {
                    if (parent.hasAttribute('data-review-id')) { isNested = true; break; }
                    parent = parent.parentElement;
                }
                if (!isNested && id && !seenIds.has(id)) {
                    seenIds.add(id);
                    outermost.push(el);
                }
            });
            reviewElements = outermost;
        } else {
            const candidates = document.querySelectorAll('div.jftiEf, div.jJc9Ad');
            const filtered: Element[] = [];
            candidates.forEach(el => {
                let dominated = false;
                for (const other of filtered) {
                    if (other.contains(el) && other !== el) { dominated = true; break; }
                }
                if (!dominated) {
                    for (let j = filtered.length - 1; j >= 0; j--) {
                        if (el.contains(filtered[j]) && el !== filtered[j]) filtered.splice(j, 1);
                    }
                    filtered.push(el);
                }
            });
            reviewElements = filtered;
        }

        const results: any[] = [];
        reviewElements.forEach((el) => {
            try {
                const reviewId = el.getAttribute('data-review-id') || '';
                const nameEl = el.querySelector('div.d4r55, button.WEBjve div.d4r55');
                const reviewerName = nameEl?.textContent?.trim() || 'Anonymous';
                const profileLink = el.querySelector('button.WEBjve');
                const reviewerUrl = profileLink?.getAttribute('data-href') || '';

                let reviewImage = '';
                const imgBtn = el.querySelector('button.Tya61d');
                if (imgBtn) {
                    const style = imgBtn.getAttribute('style') || '';
                    const match = style.match(/url\("?([^")]+)"?\)/);
                    if (match) reviewImage = match[1];
                }

                let reviewCount = 0;
                let photoCount = 0;
                const subText = el.textContent || '';
                const rc = subText.match(/(\d+)\s*reviews?/i);
                if (rc) reviewCount = parseInt(rc[1]);
                const pc = subText.match(/(\d+)\s*photos?/i);
                if (pc) photoCount = parseInt(pc[1]);

                const ratingEl = el.querySelector('span.kvMYJc');
                const ratingAttr = ratingEl?.getAttribute('aria-label') || '';
                const ratingMatch = ratingAttr.match(/(\d)/);
                const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;

                const textEl = el.querySelector('span.wiI7pd');
                const text = textEl?.textContent?.trim() || '';

                const dateEl = el.querySelector('span.rsqaWe');
                const publishedDate = dateEl?.textContent?.trim() || '';

                let responseText = '';
                let responseDate = '';
                const responseContainer = el.querySelector('div.CDe7pd');
                if (responseContainer) {
                    const respDateEl = responseContainer.querySelector('span.DZSIDd');
                    responseDate = respDateEl?.textContent?.trim() || '';
                    const respTextEl = responseContainer.querySelector('div.wiI7pd');
                    responseText = respTextEl?.textContent?.trim() || '';
                }

                if (rating > 0) {
                    results.push({
                        reviewId: reviewId || undefined,
                        reviewerName,
                        reviewerUrl: reviewerUrl || undefined,
                        reviewImage: reviewImage || undefined,
                        reviewCount: reviewCount || undefined,
                        photoCount: photoCount || undefined,
                        rating,
                        text: text || undefined,
                        publishedDate: publishedDate || undefined,
                        responseText: responseText || undefined,
                        responseDate: responseDate || undefined,
                    });
                }
            } catch {
                // Skip malformed review elements
            }
        });
        return results;
    });

    // Dedup by reviewId
    const seen = new Set<string>();
    const deduped: ScrapedReview[] = [];
    for (const r of rawReviews) {
        if (r.reviewId) {
            if (!seen.has(r.reviewId)) {
                seen.add(r.reviewId);
                deduped.push(r as ScrapedReview);
            }
        } else {
            deduped.push(r as ScrapedReview);
        }
    }

    return deduped;
}

