import { logger } from './logger';

/**
 * Normalize a business name for accurate matching.
 * Strips punctuation, legal suffixes, articles, and location qualifiers.
 */
export function normalizeBusinessName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[\u2018\u2019'`]/g, "'")            // Normalize quotes
        .replace(/&/g, ' and ')                       // & -> and (before punctuation strip)
        .replace(/[^a-z0-9'\s]/g, ' ')                // Strip punctuation except apostrophes
        .replace(/\b(llc|l\.l\.c|inc|incorporated|corp|corporation|ltd|limited|co|company|pllc|pc|the|and|of)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Tokenize a normalized name into meaningful tokens. */
function tokens(normalized: string): string[] {
    return normalized.split(' ').filter(t => t.length > 1);
}

/**
 * Check if two business names refer to the same business.
 *
 * Tiers (most to least strict):
 *  1. Exact match after normalization.
 *  2. Full containment where the shorter name is >= 5 chars.
 *  3. Token-subset match: every token of the shorter name appears in the
 *     longer name, and the shorter name has >= 2 tokens.
 *
 * Tier 3 handles Google's location-suffixed listings, e.g.
 * scan "Bob Auto" vs listing "Bob Auto - Downtown Chicago".
 */
export function businessNamesMatch(scanName: string, resultName: string): boolean {
    const normScan = normalizeBusinessName(scanName);
    const normResult = normalizeBusinessName(resultName);

    if (!normScan || !normResult) return false;

    // Tier 1: exact
    if (normScan === normResult) return true;

    const shorter = normScan.length <= normResult.length ? normScan : normResult;
    const longer = normScan.length <= normResult.length ? normResult : normScan;

    // Tier 2: containment (relaxed from 10 -> 5 chars)
    if (shorter.length >= 5 && longer.includes(shorter)) return true;

    // Tier 3: token subset
    const shortTokens = tokens(shorter);
    const longTokens = new Set(tokens(longer));
    if (shortTokens.length >= 2 && shortTokens.every(t => longTokens.has(t))) return true;

    return false;
}

export interface RankMatch {
    rank: number | null;
    targetName: string | null;
    placeId: string | null;
    cid: string | null;
    matchMethod: 'CID' | 'PlaceID' | 'CrossID' | 'Name' | 'none' | 'no-target';
}

/**
 * Resolve the target business's rank within a single grid point's results.
 *
 * Returns matchMethod 'no-target' when the scan has neither a businessName nor
 * a placeId — this is a configuration gap ("Quick Scan"), NOT a "not found"
 * result, and callers/UI must render it differently.
 */
export function resolveTargetRank(
    target: { businessName?: string | null; placeId?: string | null },
    results: Array<{ name: string; rank: number; cid?: string; placeId?: string }>
): RankMatch {
    const empty: RankMatch = { rank: null, targetName: null, placeId: null, cid: null, matchMethod: 'none' };

    if (!target.businessName && !target.placeId) {
        return { ...empty, matchMethod: 'no-target' };
    }

    let match: (typeof results)[number] | undefined;
    let matchMethod: RankMatch['matchMethod'] = 'none';

    // ── PRIORITY 1: ID matching (most reliable) ──
    if (target.placeId) {
        const isCID = /^\d+$/.test(target.placeId);
        const isChIJ = target.placeId.startsWith('ChIJ');

        if (isCID) {
            match = results.find(r => r.cid === target.placeId);
            if (match) matchMethod = 'CID';
        }
        if (!match && isChIJ) {
            match = results.find(r => r.placeId === target.placeId);
            if (match) matchMethod = 'PlaceID';
        }
        if (!match) {
            match = results.find(r =>
                (r.cid && r.cid === target.placeId) ||
                (r.placeId && r.placeId === target.placeId)
            );
            if (match) matchMethod = 'CrossID';
        }
    }

    // ── PRIORITY 2: Name matching ──
    if (!match && target.businessName) {
        match = results.find(r => businessNamesMatch(target.businessName!, r.name));
        if (match) matchMethod = 'Name';
    }

    if (!match) return empty;

    return {
        rank: match.rank,
        targetName: match.name,
        // Reuse the matched object rather than re-finding by rank (fragile).
        placeId: match.placeId ?? null,
        cid: match.cid ?? null,
        matchMethod,
    };
}

/**
 * Log why a point produced no rank. Without this, a grid of grey X markers
 * is indistinguishable from a scrape failure.
 */
export async function logMatchMiss(
    scanId: string,
    point: { lat: number; lng: number },
    target: { businessName?: string | null; placeId?: string | null },
    results: Array<{ name: string; rank: number; cid?: string }>,
    matchMethod: RankMatch['matchMethod']
) {
    if (matchMethod === 'no-target') {
        await logger.debug(
            `[Matching] Point ${point.lat},${point.lng}: no target business configured (quick scan) — rank intentionally null.`,
            'SCANNER', { scanId }
        );
        return;
    }

    const sample = results.slice(0, 5).map(r => `#${r.rank} "${r.name}"${r.cid ? ` (cid ${r.cid})` : ''}`).join(' | ');
    await logger.warn(
        `[Matching] Point ${point.lat},${point.lng}: target NOT FOUND. ` +
        `Looking for businessName="${target.businessName ?? '(none)'}" placeId="${target.placeId ?? '(none)'}". ` +
        `${results.length} listings scraped. Top 5: ${sample || '(none)'}`,
        'SCANNER', { scanId }
    );
}
