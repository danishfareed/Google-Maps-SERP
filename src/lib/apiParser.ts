/**
 * Google Maps API Data Parser
 * 
 * Parses the structured JSON data from Google Maps' window.APP_INITIALIZATION_STATE
 * This provides more accurate data extraction than DOM scraping.
 * 
 * Based on analysis of the Pleper extension's approach.
 */

// Type definitions for extracted business data
export interface APIExtractedBusiness {
    name: string;
    cid: string;
    placeId: string;
    categories: string[];
    primaryCategory: string;
    address: string;
    phone: string;
    website: string;
    reviewCount: number;
    rating: number;
    imageCount?: number;
    latitude: number;
    longitude: number;
    isVerified?: boolean;
    isSAB: boolean;
    businessProfileId?: string;
    kgId?: string;
    priceLevel?: string;
    hours?: {
        [day: string]: string;
    };
    attributes?: string[];
    url?: string;
}

/**
 * Safely get nested array value
 */
function safeGet<T>(obj: unknown, ...path: (string | number)[]): T | undefined {
    let current: unknown = obj;
    for (const key of path) {
        if (current === null || current === undefined) return undefined;
        if (typeof current !== 'object') return undefined;
        current = (current as Record<string | number, unknown>)[key];
    }
    return current as T;
}

/**
 * Convert hex CID to decimal
 */
function hexCidToDecimal(hexCid: string): string {
    try {
        // Remove 0x prefix if present
        const hex = hexCid.replace('0x', '');
        return BigInt('0x' + hex).toString();
    } catch {
        return hexCid;
    }
}

/**
 * Parse search results from the /search?tbm=map response
 * The data structure is a deeply nested array
 */
export function parseSearchResults(rawData: string): APIExtractedBusiness[] {
    const businesses: APIExtractedBusiness[] = [];

    try {
        // The response starts with )]}'  which needs to be stripped
        let cleanData = rawData;
        if (cleanData.startsWith(")]}'\n")) {
            cleanData = cleanData.substring(5);
        }
        if (cleanData.endsWith('/*""*/')) {
            cleanData = cleanData.slice(0, -6);
        }

        const data = JSON.parse(cleanData);

        // The search results are typically in data[0][1] or similar nested structure
        // This structure can vary, so we look for arrays of business entities
        const searchResults = findBusinessEntities(data);

        for (const entity of searchResults) {
            const business = parseBusinessEntity(entity);
            if (business) {
                businesses.push(business);
            }
        }
    } catch (error) {
        console.error('[APIParser] Error parsing search results:', error);
    }

    return businesses;
}

/**
 * Find business entities in the nested data structure
 * Google Maps uses deeply nested arrays with specific patterns
 */
function findBusinessEntities(data: unknown): unknown[] {
    const entities: unknown[] = [];

    function traverse(obj: unknown, depth: number = 0): void {
        if (depth > 15) return; // Prevent too deep recursion

        if (Array.isArray(obj)) {
            // Check if this looks like a business entity
            // Business entities typically have a specific structure with name, CID, categories
            if (isBusinessEntity(obj)) {
                entities.push(obj);
            } else {
                // Continue searching
                for (const item of obj) {
                    traverse(item, depth + 1);
                }
            }
        } else if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                traverse((obj as Record<string, unknown>)[key], depth + 1);
            }
        }
    }

    traverse(data);
    return entities;
}

/**
 * Check if an array looks like a business entity
 * Business entities have specific patterns:
 * - Index 11 or 14 typically contains the name
 * - Index 10 contains CID hex string (0x...)
 * - Index 13 or similar contains categories array
 */
function isBusinessEntity(arr: unknown[]): boolean {
    if (arr.length < 15) return false;

    // Check for typical patterns
    // Pattern 1: arr[11] is name (string), arr[10] has hex format
    const hasName = typeof safeGet(arr, 11) === 'string' &&
        (safeGet<string>(arr, 11) || '').length > 0 &&
        (safeGet<string>(arr, 11) || '').length < 200;

    const hasCid = typeof safeGet(arr, 10) === 'string' &&
        (safeGet<string>(arr, 10) || '').includes('0x');

    // Pattern 2: Categories are typically in arr[13]
    const hasCategories = Array.isArray(safeGet(arr, 13));

    return hasName && (hasCid || hasCategories);
}

/**
 * Parse a single business entity from the nested array structure
 */
function parseBusinessEntity(entity: unknown): APIExtractedBusiness | null {
    if (!Array.isArray(entity)) return null;

    try {
        // Extract name - typically at index 11
        const name = safeGet<string>(entity, 11) || '';
        if (!name) return null;

        // Extract CID from index 10 (format: 0x...:0x...)
        let cid = '';
        const cidRaw = safeGet<string>(entity, 10) || '';
        if (cidRaw.includes('0x')) {
            const cidMatch = cidRaw.match(/0x[\da-fA-F]+:0x([\da-fA-F]+)/);
            if (cidMatch) {
                cid = hexCidToDecimal(cidMatch[1]);
            }
        }

        // Extract Place ID - typically at index 78 or in nested structure
        let placeId = safeGet<string>(entity, 78) || '';
        if (!placeId) {
            // Try alternative location
            placeId = safeGet<string>(entity, 0, 0, 0, 1) || '';
        }

        // Extract categories - typically at index 13
        const categoriesRaw = safeGet<unknown[]>(entity, 13) || [];
        const categories: string[] = [];
        if (Array.isArray(categoriesRaw)) {
            for (const cat of categoriesRaw) {
                if (typeof cat === 'string') {
                    categories.push(cat);
                } else if (Array.isArray(cat) && typeof cat[0] === 'string') {
                    categories.push(cat[0]);
                }
            }
        }

        // Extract address - typically at index 18 or in address array
        const address = safeGet<string>(entity, 18) ||
            safeGet<string>(entity, 2) ||
            safeGet<string>(entity, 39) || '';

        // Extract phone - typically at index 178 nested
        let phone = safeGet<string>(entity, 178, 0, 3) ||
            safeGet<string>(entity, 178, 0, 0) ||
            safeGet<string>(entity, 7, 0) || '';

        // Extract website - typically at index 7 or 176
        const website = safeGet<string>(entity, 7, 1) ||
            safeGet<string>(entity, 176, 0, 5) || '';

        // Extract rating - typically at index 4 nested  
        const rating = safeGet<number>(entity, 4, 7) ||
            safeGet<number>(entity, 4, 0) || 0;

        // Extract review count - typically at index 4 nested
        const reviewCount = safeGet<number>(entity, 4, 8) ||
            safeGet<number>(entity, 4, 1) || 0;

        // Extract coordinates - typically at index 9
        const latitude = safeGet<number>(entity, 9, 2) ||
            safeGet<number>(entity, 9, 0) || 0;
        const longitude = safeGet<number>(entity, 9, 3) ||
            safeGet<number>(entity, 9, 1) || 0;

        // Extract image count
        const imageCount = safeGet<number>(entity, 6, 1) || undefined;

        // Extract price level ($, $$, etc) - typically at index 4
        const priceLevel = safeGet<string>(entity, 4, 2) || undefined;

        // Check if SAB (Service Area Business) - no physical address shown
        // Logic from scraper.ts: if it has digits, it's likely physical
        const isPhysicalAddress = address && /\d/.test(address);
        const servesTextRaw = (safeGet(entity, 25) || safeGet(entity, 24) || '');
        const servesText = String(servesTextRaw).toLowerCase();
        const hasServesIndicator = servesText.includes('serves') || servesText.includes('service area') || servesText.includes('serving');
        const explicitSABFlag = safeGet(entity, 24) === true || safeGet(entity, 49) === 1 || safeGet(entity, 49) === true;

        let isSAB = !address || address === 'hidden';

        if (explicitSABFlag) {
            isSAB = true;
        } else if (hasServesIndicator && !isPhysicalAddress) {
            isSAB = true;
        }

        // Final override: if there's an address with a number, it's NOT an SAB
        if (address && /\d+/.test(address)) {
            isSAB = false;
        }

        // Build URL
        const url = cid ? `https://www.google.com/maps?cid=${cid}` : '';

        return {
            name,
            cid,
            placeId,
            categories,
            primaryCategory: categories[0] || '',
            address: address === 'hidden' ? '' : address,
            phone: phone || '',
            website: website || '',
            reviewCount,
            rating,
            imageCount,
            latitude,
            longitude,
            isSAB,
            priceLevel,
            url
        };
    } catch (error) {
        console.error('[APIParser] Error parsing entity:', error);
        return null;
    }
}

/**
 * Parse APP_INITIALIZATION_STATE from page HTML
 * This extracts the JSON data embedded in the page
 */
export function parseAppInitializationState(html: string): unknown | null {
    try {
        // Find the APP_INITIALIZATION_STATE assignment
        const startMarker = 'window.APP_INITIALIZATION_STATE=';
        const startIdx = html.indexOf(startMarker);
        if (startIdx === -1) return null;

        // Find the end of the JSON (it ends with ;</script> or similar)
        let jsonStart = startIdx + startMarker.length;
        let depth = 0;
        let inString = false;
        let escaped = false;
        let jsonEnd = jsonStart;

        for (let i = jsonStart; i < html.length; i++) {
            const char = html[i];

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            if (char === '"' && !escaped) {
                inString = !inString;
                continue;
            }

            if (inString) continue;

            if (char === '[' || char === '{') depth++;
            if (char === ']' || char === '}') depth--;

            if (depth === 0 && i > jsonStart) {
                jsonEnd = i + 1;
                break;
            }
        }

        const jsonStr = html.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('[APIParser] Error parsing APP_INITIALIZATION_STATE:', error);
        return null;
    }
}

/**
 * Alternative parser: Extract from search XHR response directly
 * This parses the specific format from /search?tbm=map responses
 */
export function parseMapSearchXHR(responseText: string): APIExtractedBusiness[] {
    const businesses: APIExtractedBusiness[] = [];

    try {
        // Strip the prefix )]}'\n if present
        let jsonStr = responseText;
        if (jsonStr.startsWith(")]}'")) {
            jsonStr = jsonStr.substring(jsonStr.indexOf('\n') + 1);
        }
        // Strip suffix /*""*/ if present
        if (jsonStr.endsWith('/*""*/')) {
            jsonStr = jsonStr.slice(0, -6);
        }

        const data = JSON.parse(jsonStr);

        // Navigate to the business listings
        // Structure: data.d → array of results
        // Each result: [null, null, [businessData], ...]

        // Try different known paths
        const paths = [
            [0, 1],      // Common path
            [0, 1, 0],   // Alternative
            ['d'],       // Named property
        ];

        let listings: unknown[] | null = null;
        for (const path of paths) {
            const attempt = safeGet<unknown[]>(data, ...path as (string | number)[]);
            if (Array.isArray(attempt) && attempt.length > 0) {
                listings = attempt;
                break;
            }
        }

        if (!listings) {
            // Try to find it by traversing
            listings = findListingsArray(data);
        }

        if (listings) {
            for (let i = 0; i < listings.length; i++) {
                const item = listings[i];
                if (Array.isArray(item)) {
                    // Look for the business data within each item
                    const businessData = findBusinessDataInItem(item);
                    if (businessData) {
                        const business = parseListingFromData(businessData, i + 1);
                        if (business) {
                            businesses.push(business);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('[APIParser] Error parsing map search XHR:', error);
    }

    return businesses;
}

/**
 * Find the main listings array in the response
 */
function findListingsArray(data: unknown): unknown[] | null {
    if (!data || typeof data !== 'object') return null;

    // Recursively search for an array that contains business-like items
    function search(obj: unknown, depth: number = 0): unknown[] | null {
        if (depth > 8) return null;

        if (Array.isArray(obj)) {
            // Check if this array contains business-like items
            const businessItems = obj.filter((item, idx) => {
                if (!Array.isArray(item)) return false;
                // Business items typically have a specific nested structure
                const hasInfo = item.length > 5;
                return hasInfo && idx > 0; // Skip first item often metadata
            });

            if (businessItems.length >= 3) {
                return businessItems;
            }

            // Search within
            for (const item of obj) {
                const result = search(item, depth + 1);
                if (result) return result;
            }
        } else if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                const result = search((obj as Record<string, unknown>)[key], depth + 1);
                if (result) return result;
            }
        }

        return null;
    }

    return search(data);
}

/**
 * Find business data within a listing item
 */
function findBusinessDataInItem(item: unknown[]): unknown[] | null {
    // The business data is typically nested within the item
    // Structure varies, but usually item[14] or item[0][14] contains the main data

    const directData = safeGet<unknown[]>(item, 14);
    if (Array.isArray(directData) && directData.length > 10) {
        return directData;
    }

    const nestedData = safeGet<unknown[]>(item, 0, 14);
    if (Array.isArray(nestedData) && nestedData.length > 10) {
        return nestedData;
    }

    // Try finding by pattern matching
    function findData(arr: unknown[]): unknown[] | null {
        for (const elem of arr) {
            if (Array.isArray(elem) && elem.length > 15) {
                // Check if it has name-like data at index 11
                const nameCandidate = safeGet(elem, 11);
                if (typeof nameCandidate === 'string' && nameCandidate.length > 1) {
                    return elem;
                }
            }
            if (Array.isArray(elem)) {
                const found = findData(elem);
                if (found) return found;
            }
        }
        return null;
    }

    return findData(item);
}

/**
 * Parse a listing from the extracted data array
 * This handles the Google Maps internal data structure
 */
function parseListingFromData(data: unknown[], rank: number): APIExtractedBusiness | null {
    try {
        // Index mappings (these can vary, so we try multiple)
        // 11: name
        // 10: place reference (contains CID)
        // 13: categories
        // 18/39: address
        // 7/178: phone
        // 4: rating/reviews
        // 9: coordinates

        const name = getString(data, [11]) ||
            getString(data, [0, 11]) ||
            getString(data, [14, 11]);

        if (!name) return null;

        // CID from place reference
        let cid = '';
        const placeRef = getString(data, [10]) || getString(data, [0, 10]) || '';
        if (placeRef.includes('0x')) {
            const cidMatch = placeRef.match(/0x[\da-fA-F]+:0x([\da-fA-F]+)/);
            if (cidMatch) {
                cid = hexCidToDecimal(cidMatch[1]);
            }
        }

        // Place ID
        let placeId = getString(data, [78]) || getString(data, [0, 78]) || '';
        if (!placeId) {
            // Try extracting from another location
            const ftid = getString(data, [0, 0, 1]);
            if (ftid) placeId = ftid;
        }

        // Categories
        const categories: string[] = [];
        const catArr = getArray(data, [13]) || getArray(data, [14, 13]) || [];
        for (const cat of catArr) {
            if (typeof cat === 'string') {
                categories.push(cat);
            } else if (Array.isArray(cat) && typeof cat[0] === 'string') {
                categories.push(cat[0]);
            }
        }

        // Address
        const address = getString(data, [18]) ||
            getString(data, [39]) ||
            getString(data, [2]) ||
            getString(data, [14, 18]) || '';

        // Phone
        const phone = getString(data, [178, 0, 3]) ||
            getString(data, [178, 0, 0]) ||
            getString(data, [7, 0]) ||
            getString(data, [14, 178, 0, 3]) || '';

        // Website
        const website = getString(data, [7, 1]) ||
            getString(data, [176, 0, 5]) ||
            getString(data, [7]) || '';

        // Rating & Reviews (usually in index 4)
        const ratingArr = getArray(data, [4]) || getArray(data, [14, 4]) || [];
        const rating = getNumber(ratingArr, [7]) || getNumber(ratingArr, [0]) || 0;
        const reviewCount = getNumber(ratingArr, [8]) || getNumber(ratingArr, [1]) || 0;

        // Coordinates (usually in index 9)
        const coordArr = getArray(data, [9]) || getArray(data, [14, 9]) || [];
        const latitude = getNumber(coordArr, [2]) || getNumber(coordArr, [0]) || 0;
        const longitude = getNumber(coordArr, [3]) || getNumber(coordArr, [1]) || 0;

        // Image count
        const imageCount = getNumber(data, [6, 1]) || undefined;

        // Price level
        const priceLevel = getString(data, [4, 2]) || undefined;

        // SAB detection
        const isPhysicalAddress = address && /\d/.test(address);
        const isSAB = (!address || address.toLowerCase().includes('serves')) && !isPhysicalAddress;

        return {
            name,
            cid,
            placeId,
            categories,
            primaryCategory: categories[0] || '',
            address,
            phone,
            website,
            reviewCount,
            rating,
            imageCount,
            latitude,
            longitude,
            isSAB,
            priceLevel,
            url: cid ? `https://www.google.com/maps?cid=${cid}` : ''
        };
    } catch (error) {
        console.error('[APIParser] Error parsing listing data:', error);
        return null;
    }
}

// Helper functions for safe nested access
function getString(obj: unknown, path: (number | string)[]): string {
    const val = safeGet<string>(obj, ...path);
    return typeof val === 'string' ? val : '';
}

function getNumber(obj: unknown, path: (number | string)[]): number {
    const val = safeGet<number>(obj, ...path);
    return typeof val === 'number' ? val : 0;
}

function getArray(obj: unknown, path: (number | string)[]): unknown[] {
    const val = safeGet<unknown[]>(obj, ...path);
    return Array.isArray(val) ? val : [];
}
