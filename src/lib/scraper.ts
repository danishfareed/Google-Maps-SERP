import { BrowserContext, Page } from 'playwright';
import { logger } from './logger';

export interface ScrapeResult {
    name: string;
    rating?: number;
    reviews?: number;
    address?: string;
    url?: string;
    rank: number;
    // Enhanced fields
    category?: string;
    isSAB?: boolean; // Service Area Business
    phone?: string;
    website?: string;
    priceLevel?: string; // $, $$, $$$, $$$$

    // Deep GBP extraction fields
    cid?: string;              // Google Customer ID (from URL)
    placeId?: string;          // Google Place ID (from URL)
    allCategories?: string[];  // All categories (primary + secondary)
    attributes?: string[];     // Business attributes (wheelchair, wifi, etc.)
    hours?: string;            // Business hours (JSON string)
    photosCount?: number;      // Number of photos
    yearsInBusiness?: number;  // Years operating
    openNow?: boolean;         // Currently open
    profileCompleteness?: number; // 0-100 score
    businessProfileId?: string;   // Google Business Profile ID (19-digit)
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

        // Handle Google Consent (supports English, German, Arabic, etc.)
        try {
            const consentSelector = 'button[aria-label="Accept all"], button[aria-label="Alle akzeptieren"], button[aria-label="قبول الكل"], form[action*="consent"] button:last-child';
            // Short timeout check to avoid slowing down happy path
            if (await page.locator(consentSelector).first().isVisible({ timeout: 2000 })) {
                await logger.debug('Consent dialog detected in scraper. Clicking accept...', 'SCANNER');
                await page.locator(consentSelector).first().click();
                await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
            }
        } catch (e) {
            // Ignore timeouts
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

        // =============================================================
        // PRIMARY EXTRACTION: API Data (Pleper-style)
        // Extract from window.APP_INITIALIZATION_STATE for accurate data
        // =============================================================
        let apiResults: ScrapeResult[] | null = null;

        try {
            apiResults = await extractFromAPIData(page);
            if (apiResults && apiResults.length > 0) {
                await logger.debug(`[Scraper] API extraction found ${apiResults.length} businesses`, 'SCANNER');
                return apiResults;
            }
        } catch (apiError) {
            console.log('[Scraper] API extraction failed, falling back to DOM:', apiError);
        }

        // =============================================================
        // FALLBACK: DOM Scraping (if API extraction fails)
        // =============================================================
        await logger.debug('[Scraper] Using DOM fallback extraction...', 'SCANNER');
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

                // URL/Link Extraction with CID and PlaceID parsing
                const linkEl = item.querySelector('a[href*="/maps/place/"]') || item.closest('a[href*="/maps/place/"]');
                const url = linkEl ? (linkEl as HTMLAnchorElement).href : '';

                // Extract CID from URL (format: !1s0x...!2s or /data=...!1s)
                let cid: string | undefined;
                let placeId: string | undefined;
                if (url) {
                    // CID is sometimes in the data parameter as hex
                    const cidMatch = url.match(/0x[\da-fA-F]+:0x([\da-fA-F]+)/);
                    if (cidMatch) {
                        // Convert hex to decimal CID
                        try {
                            cid = BigInt('0x' + cidMatch[1]).toString();
                        } catch (e) {
                            // Fall back to hex
                            cid = cidMatch[1];
                        }
                    }
                    // PlaceID is often in !19s or ftid= parameter
                    const placeIdMatch = url.match(/!19s([^!]+)/) || url.match(/ftid=([^&]+)/);
                    if (placeIdMatch) {
                        placeId = decodeURIComponent(placeIdMatch[1]);
                    }
                }

                // Rating & Reviews extraction - multiple fallback patterns
                const ratingEl = item.querySelector('[role="img"][aria-label*="stars"]');
                const ratingLabel = ratingEl?.getAttribute('aria-label') || '';
                const ratingMatch = ratingLabel.match(/([0-9.]+)\s+stars/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

                // Get full text content for extraction  
                const text = (item as HTMLElement).innerText || '';
                const lines = text.split('\n').filter(l => l.trim());

                // Reviews: try multiple patterns
                let reviews = 0;
                // Pattern 1: "(123)" or "(1,234)"
                const reviewPattern1 = ratingLabel.match(/\(([\d,]+)\)/);
                // Pattern 2: "123 reviews" or "1,234 reviews"
                const reviewPattern2 = text.match(/([\d,]+)\s*reviews?/i);
                // Pattern 3: "123 Google reviews"  
                const reviewPattern3 = text.match(/([\d,]+)\s*Google\s*reviews/i);
                // Pattern 4: From rating aria-label "4.5 stars 123 reviews"
                const reviewPattern4 = ratingLabel.match(/stars?\s+([\d,]+)/);

                const reviewMatch = reviewPattern1 || reviewPattern2 || reviewPattern3 || reviewPattern4;
                if (reviewMatch) {
                    reviews = parseInt(reviewMatch[1].replace(/,/g, ''));
                }

                // Address extraction - look for lines with numbers (street addresses)
                // Filter out rating patterns like "4.7(286)"
                const isRatingPattern = (s: string) => /^\d(\.\d)?\s*\(\d+(,\d+)*\)$/.test(s.trim()) || /^[\d.]+\s*stars?$/i.test(s.trim());
                const address = lines.find(l =>
                    l.match(/\d+/) &&
                    l !== name &&
                    l.length > 5 &&
                    !isRatingPattern(l) &&
                    !l.includes(' · ')
                ) || '';

                // Category extraction - get all categories from the listing
                // Must be very careful to exclude non-category data
                const allCategories: string[] = [];
                let category = '';

                // Helper to check if a string is a valid category
                const isValidCategory = (str: string): boolean => {
                    const cleaned = str.trim();
                    if (!cleaned || cleaned.length < 2 || cleaned.length > 50) return false;

                    // Exclude price levels
                    if (/^\$+$/.test(cleaned)) return false;
                    // Exclude ratings/reviews
                    if (isRatingPattern(cleaned)) return false;
                    if (/^\d+\.?\d*\s*(stars?|reviews?)/i.test(cleaned)) return false;
                    if (/^\(\d+\)$/.test(cleaned)) return false;  // (reviews count)
                    if (/^\d\.\d$/.test(cleaned)) return false; // Single rating like 4.7
                    // Exclude distances
                    if (/^\d+\.?\d*\s*(mi|km|miles?|meters?|ft)$/i.test(cleaned)) return false;
                    // Exclude phone numbers
                    if (/^[\d\s\-().+]+$/.test(cleaned) && cleaned.replace(/\D/g, '').length >= 7) return false;
                    // Exclude addresses (contain numbers followed by street names)
                    if (/^\d+\s+[A-Za-z]/.test(cleaned) && cleaned.length > 10) return false;
                    // Exclude hours patterns
                    if (/^(open|closed|opens?|closes?)\s*(at|now|24)/i.test(cleaned)) return false;
                    if (/^\d{1,2}(:\d{2})?\s*(AM|PM)/i.test(cleaned)) return false;
                    // Exclude "Serves" area patterns
                    if (/^serves/i.test(cleaned)) return false;
                    // Exclude URLs
                    if (/^(https?:|www\.)/i.test(cleaned)) return false;
                    // Exclude pure numbers with separators
                    if (/^[\d$.,\s]+$/.test(cleaned)) return false;

                    return true;
                };

                // Find lines with separator that might contain categories
                const categoryLine = lines.find(l => l.includes(' · ') && !l.includes('stars'));
                if (categoryLine) {
                    const parts = categoryLine.split(' · ');
                    parts.forEach(part => {
                        if (isValidCategory(part)) {
                            allCategories.push(part.trim());
                        }
                    });
                    if (allCategories.length > 0) {
                        category = allCategories[0];
                    }
                }

                // Phone extraction - multiple patterns for different formats
                let phone: string | undefined;
                // Try US patterns first
                const phonePattern1 = text.match(/(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
                // International formats  
                const phonePattern2 = text.match(/(\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/);
                // Check for phone in aria-labels
                const phoneBtn = item.querySelector('button[aria-label*="Call"], button[data-tooltip*="Call"], a[aria-label*="phone"]');
                const phoneFromBtn = phoneBtn?.getAttribute('aria-label')?.match(/[\d\s\-().+]+/)?.[0]?.trim();
                phone = phoneFromBtn || phonePattern1?.[1] || phonePattern2?.[1];

                // Website detection - multiple strategies
                let website: string | undefined;
                // Strategy 1: data-value attribute
                const websiteBtn1 = item.querySelector('a[data-value="Website"]');
                // Strategy 2: aria-label contains Website  
                const websiteBtn2 = item.querySelector('a[aria-label*="Website"]');
                // Strategy 3: button in actions with external link
                const websiteBtn3 = item.querySelector('a[href^="http"]:not([href*="google.com"]):not([href*="maps.google"])');
                const websiteEl = websiteBtn1 || websiteBtn2 || websiteBtn3;
                if (websiteEl) {
                    website = (websiteEl as HTMLAnchorElement).href;
                }

                // SAB (Service Area Business) detection
                const isSAB = text.includes('Serves') || text.includes('Service area') ||
                    text.toLowerCase().includes('serves your area') ||
                    !address;

                // Price Level extraction ($, $$, $$$, $$$$)
                const priceLevelMatch = text.match(/(\$+)(?:\s|·|$)/);
                const priceLevel = priceLevelMatch ? priceLevelMatch[1] : undefined;

                // Open Now detection
                const openNow = text.toLowerCase().includes('open') &&
                    (text.toLowerCase().includes('open now') || text.toLowerCase().includes('opens '));

                // Years in business extraction
                let yearsInBusiness: number | undefined;
                const yearsMatch = text.match(/(\d+)\+?\s+years?\s+in\s+business/i);
                if (yearsMatch) {
                    yearsInBusiness = parseInt(yearsMatch[1]);
                }

                // Calculate profile completeness score (0-100)
                let completenessScore = 0;
                if (name) completenessScore += 15;
                if (rating !== undefined) completenessScore += 10;
                if (reviews && reviews > 0) completenessScore += 10;
                if (address) completenessScore += 15;
                if (phone) completenessScore += 10;
                if (website) completenessScore += 10;
                if (allCategories.length > 0) completenessScore += 10;
                if (allCategories.length > 1) completenessScore += 5;
                if (priceLevel) completenessScore += 5;
                if (!isSAB) completenessScore += 5; // Physical location
                if (yearsInBusiness) completenessScore += 5;

                extracted.push({
                    name,
                    rating,
                    reviews,
                    address: address.trim(),
                    url,
                    rank: extracted.length + 1,
                    category,
                    isSAB,
                    phone,
                    website,
                    priceLevel,
                    // New deep extraction fields
                    cid,
                    placeId,
                    allCategories: allCategories.length > 0 ? allCategories : undefined,
                    openNow,
                    yearsInBusiness,
                    profileCompleteness: completenessScore
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

/**
 * Extract business data from Google Maps' internal API data
 * This is the Pleper-style extraction method - more accurate than DOM scraping
 */
async function extractFromAPIData(page: Page): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];

    // Extract APP_INITIALIZATION_STATE and search result data from the page
    const extractedData = await page.evaluate(() => {
        // Helper to safely traverse nested arrays
        function safeGet(obj: unknown, ...path: (string | number)[]): unknown {
            let current = obj;
            for (const key of path) {
                if (current === null || current === undefined) return undefined;
                if (typeof current !== 'object') return undefined;
                current = (current as Record<string | number, unknown>)[key];
            }
            return current;
        }

        // Helper to convert hex CID to decimal
        function hexToDecimal(hex: string): string {
            try {
                const cleanHex = hex.replace('0x', '');
                return BigInt('0x' + cleanHex).toString();
            } catch {
                return hex;
            }
        }

        // Try to get APP_INITIALIZATION_STATE
        const appState = (window as any).APP_INITIALIZATION_STATE;
        if (!appState) return null;

        // The search results are typically in appState[3] area
        // Structure can be: appState[3]['ug'][2] or appState[3][2]
        let rawData: string | null = null;

        try {
            if (appState[3]?.['ug']?.[2]) {
                rawData = appState[3]['ug'][2];
            } else if (appState[3]?.[2]) {
                rawData = appState[3][2];
            }
        } catch {
            return null;
        }

        if (!rawData || typeof rawData !== 'string') return null;

        // Parse the encoded data
        let parsedData: unknown;
        try {
            // The data is often double-encoded or has special prefixes
            let cleanData = rawData;
            if (cleanData.startsWith(")]}'")) {
                cleanData = cleanData.substring(cleanData.indexOf('\n') + 1);
            }
            parsedData = JSON.parse(cleanData);
        } catch {
            return null;
        }

        // Find and extract business listings
        const businesses: any[] = [];

        function findListings(data: unknown, depth: number = 0): void {
            if (depth > 12 || businesses.length >= 25) return;

            if (Array.isArray(data)) {
                // Check if this array contains a business listing
                // Listings typically have name at index 11 and coordinates at index 9
                if (data.length > 15) {
                    const name = safeGet(data, 11);
                    const coords = safeGet(data, 9);
                    const hasName = typeof name === 'string' && name.length > 1 && name.length < 200;
                    const hasCoords = Array.isArray(coords) && coords.length >= 2;

                    if (hasName && hasCoords) {
                        businesses.push(data);
                        return; // Don't traverse into this, we found the listing
                    }
                }

                // Continue searching in child arrays
                for (const item of data) {
                    findListings(item, depth + 1);
                }
            }
        }

        findListings(parsedData);

        // Parse each business
        const parsed = businesses.map((biz, index) => {
            const name = safeGet(biz, 11) as string || '';
            if (!name) return null;

            // CID from place reference (index 10, format: 0x...:0x...)
            let cid = '';
            const placeRef = safeGet(biz, 10) as string || '';
            if (placeRef.includes('0x')) {
                const match = placeRef.match(/0x[\da-fA-F]+:0x([\da-fA-F]+)/);
                if (match) cid = hexToDecimal(match[1]);
            }

            // Coordinates (index 9)
            const coordsArr = safeGet(biz, 9) as number[] || [];
            const latitude = coordsArr[2] ?? coordsArr[0] ?? 0;
            const longitude = coordsArr[3] ?? coordsArr[1] ?? 0;

            // Categories (index 13)
            const rawCategories = safeGet(biz, 13) as unknown[] || [];
            const categories: string[] = [];
            for (const cat of rawCategories) {
                if (typeof cat === 'string') categories.push(cat);
                else if (Array.isArray(cat) && typeof cat[0] === 'string') categories.push(cat[0]);
            }

            // Address (multiple possible indices - Google uses different indices)
            // Common indices: 18 (formatted), 39 (full), 2 (short), 183 (components)
            let address = '';
            const addressCandidates: string[] = [
                safeGet(biz, 18),       // Formatted address
                safeGet(biz, 39),       // Full address
                safeGet(biz, 2),        // Short address
                safeGet(biz, 14),       // Neighborhood/Area
                safeGet(biz, 3),        // Street/Building name
                safeGet(biz, 183, 1, 2), // Address components
                safeGet(biz, 183, 1, 0), // Street
            ].map(cand => {
                if (!cand) return '';
                if (Array.isArray(cand)) return cand.filter(v => typeof v === 'string').join(', ');
                return String(cand);
            }).filter(Boolean);

            // Pick the best address (longest one that looks like a street address)
            // AND specifically filter out rating patterns (e.g. "4.7(286)")
            const isRatingPattern = (str: string) => /^\d(\.\d)?\s*\(\d+(,\d+)*\)$/.test(str.trim()) || /^[\d.]+\s*stars?$/i.test(str.trim());
            for (const candidate of addressCandidates) {
                if (candidate && candidate.length > address.length && !isRatingPattern(candidate)) {
                    // TRUST GOOGLE: If it's a formatted address (index 18 or 39), accept it even without digits
                    const isFormattedAddress = candidate === safeGet(biz, 18) || candidate === safeGet(biz, 39);

                    // Standard check: digit OR street identifier
                    const hasDigit = /\d/.test(candidate);
                    const hasStreetWord = /\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|ct|court|pl|place|building|suite|floor|univ|campus|square|market|plaza)\b/i.test(candidate);

                    if (isFormattedAddress || hasDigit || hasStreetWord) {
                        address = candidate;
                    }
                }
            }

            // Deep search fallback
            if (!address) {
                const deepFindAddress = (obj: any, depth: number = 0): string | null => {
                    if (depth > 5) return null;
                    if (Array.isArray(obj)) {
                        for (const item of obj) {
                            if (typeof item === 'string') {
                                if (item.length > 5 && item.length < 100 &&
                                    /\d/.test(item) &&
                                    /\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|way|ct|court|pl|place)\b/i.test(item) &&
                                    !isRatingPattern(item) &&
                                    !item.includes(' · ') &&
                                    !/^(open|closed|map)/i.test(item)) {
                                    return item;
                                }
                            } else if (typeof item === 'object' && item !== null) {
                                const found = deepFindAddress(item, depth + 1);
                                if (found) return found;
                            }
                        }
                    }
                    return null;
                };

                const fallback = deepFindAddress(safeGet(biz, 2)) ||
                    deepFindAddress(safeGet(biz, 4)) ||
                    deepFindAddress(safeGet(biz, 34)) ||
                    deepFindAddress(safeGet(biz, 39));

                if (fallback) address = fallback;
            }

            // Extract other fields
            const phone = (safeGet(biz, 178, 0, 3) as string) || (safeGet(biz, 178, 0, 0) as string) || (safeGet(biz, 7, 0) as string) || '';
            let website = (safeGet(biz, 7, 1) as string) || (safeGet(biz, 176, 0, 5) as string) || '';
            if (website && !website.startsWith('http')) website = '';

            const ratingData = safeGet(biz, 4) as number[] || [];
            const rating = (ratingData[7] ?? ratingData[0] ?? 0) as number;
            const reviews = (ratingData[8] ?? ratingData[1] ?? 0) as number;
            const priceLevel = safeGet(biz, 4, 2) as string || undefined;
            const imageCount = safeGet(biz, 6, 1) as number || undefined;
            // cid is already declared above
            const placeId = (safeGet(biz, 78) as string) || (safeGet(biz, 0, 0, 1) as string) || '';

            // Business Profile ID
            let businessProfileId = '';
            const bpIdRaw = safeGet(biz, 10, 11) || safeGet(biz, 154, 0, 0);
            if (bpIdRaw && /^\d{19}$/.test(String(bpIdRaw))) {
                businessProfileId = String(bpIdRaw);
            } else {
                const findBPId = (obj: any, depth: number = 0): string | null => {
                    if (depth > 5 || !obj) return null;
                    if (typeof obj === 'string' || typeof obj === 'number') {
                        const s = String(obj);
                        if (/^\d{19}$/.test(s)) return s;
                    } else if (typeof obj === 'object') {
                        for (const key in obj) {
                            const result = findBPId(obj[key], depth + 1);
                            if (result) return result;
                        }
                    }
                    return null;
                };
                businessProfileId = findBPId(biz) || '';
            }

            // SAB Logic - Relaxed
            let isSAB = false;
            const servesTextRaw = (safeGet(biz, 25) as string || safeGet(biz, 24) as string || '');
            const servesText = String(servesTextRaw).toLowerCase();
            const hasServesIndicator = servesText.includes('serves') || servesText.includes('service area') || servesText.includes('serving');
            const explicitSABFlag = safeGet(biz, 49) === 1 || safeGet(biz, 49) === true;
            const sabHint = safeGet(biz, 33);
            const hasSABHint = (Array.isArray(sabHint) && sabHint.length === 0) || sabHint === true;

            const isPhysicalAddress = address && (/\d/.test(address) || address.split(',').length > 2);

            if (explicitSABFlag) {
                isSAB = true;
            } else if (hasServesIndicator || hasSABHint) {
                if (!isPhysicalAddress) {
                    isSAB = true;
                }
            }
            if (address && /\d+/.test(address)) {
                isSAB = false;
            }

            const url = cid ? `https://www.google.com/maps?cid=${cid}` : '';

            return {
                name,
                rating: rating || undefined,
                reviews: reviews || 0,
                address,
                url,
                rank: index + 1,
                category: categories[0] || '',
                isSAB,
                phone: phone || undefined,
                website: website || undefined,
                priceLevel,
                cid: cid || undefined,
                placeId: placeId || undefined,
                businessProfileId: businessProfileId || undefined,
                allCategories: categories.length > 0 ? categories : undefined,
                photosCount: imageCount,
                profileCompleteness: calculateCompleteness({
                    name, rating, reviews, address, phone, website, categories, isSAB, priceLevel
                })
            };
        });

        return parsed.filter(Boolean);

        function calculateCompleteness(data: any): number {
            let score = 0;
            if (data.name) score += 15;
            if (data.rating) score += 10;
            if (data.reviews > 0) score += 10;
            if (data.address) score += 15;
            if (data.phone) score += 10;
            if (data.website) score += 10;
            if (data.categories?.length > 0) score += 10;
            if (data.categories?.length > 1) score += 5;
            if (data.priceLevel) score += 5;
            if (!data.isSAB) score += 5;
            return score;
        }
    });

    if (!extractedData || !Array.isArray(extractedData)) {
        return [];
    }

    // Convert to ScrapeResult format
    for (const item of extractedData) {
        if (!item) continue;
        results.push(item as ScrapeResult);
    }

    return results;
}
