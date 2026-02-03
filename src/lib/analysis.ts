/**
 * Analysis module for competitor intelligence and GBP insights
 * Provides algorithms for analyzing scan results and generating actionable insights
 */

import { ScrapeResult } from './scraper';

export interface CategoryAnalysis {
    category: string;
    count: number;
    percentage: number;
    avgRating: number;
    avgReviews: number;
}

export interface CompetitorProfile {
    name: string;
    appearances: number;
    avgRank: number;
    bestRank: number;
    worstRank: number;
    rating?: number;
    reviews?: number;
    category?: string;
    allCategories?: string[];
    profileCompleteness?: number;
    cid?: string;
    placeId?: string;
    address?: string;
    phone?: string;
    website?: string;
    isSAB?: boolean;
    businessProfileId?: string;
    photosCount?: number;
    yearsInBusiness?: number;
}


export interface ReviewMetrics {
    avgRating: number;
    avgReviews: number;
    totalReviews: number;
    maxReviews: number;
    minReviews: number;
    withoutReviews: number;
    ratingDistribution: { [key: string]: number };
}

export interface CategoryMetrics {
    totalCategories: number;
    avgCategoriesPerBusiness: number;
    maxCategories: number;
    topCategories: CategoryAnalysis[];
    categoryGaps: string[]; // Categories used by competitors but not target
}

export interface ProfileMetrics {
    avgCompleteness: number;
    withPhone: number;
    withWebsite: number;
    withAddress: number;
    servicAreaBusinesses: number;
    physicalLocations: number;
}

export interface CompetitorIntelligence {
    competitors: CompetitorProfile[];
    categoryMetrics: CategoryMetrics;
    reviewMetrics: ReviewMetrics;
    profileMetrics: ProfileMetrics;
}

/**
 * Analyze all results from a scan to generate competitor intelligence
 */
export function analyzeCompetitors(
    results: Array<{ topResults: string; lat: number; lng: number }>,
    targetBusinessName?: string
): CompetitorIntelligence {
    const allBusinesses = new Map<string, CompetitorProfile>();
    const allCategories = new Map<string, CategoryAnalysis>();
    const categoryCountPerBusiness: number[] = [];

    let totalRating = 0;
    let totalReviews = 0;
    let ratingCount = 0;
    let reviewCount = 0;
    let maxReviews = 0;
    let minReviews = Infinity;
    let withoutReviews = 0;

    let withPhone = 0;
    let withWebsite = 0;
    let withAddress = 0;
    let sabCount = 0;
    let totalCompleteness = 0;
    let completenessCount = 0;

    const ratingDistribution: { [key: string]: number } = {
        '5': 0, '4': 0, '3': 0, '2': 0, '1': 0, 'none': 0
    };

    // Process all results
    results.forEach(result => {
        try {
            const businesses: ScrapeResult[] = JSON.parse(result.topResults);

            businesses.forEach(biz => {
                const key = biz.name.toLowerCase();

                // Skip target business for competitor analysis
                if (targetBusinessName && key.includes(targetBusinessName.toLowerCase())) {
                    return;
                }

                // Aggregate business data
                if (!allBusinesses.has(key)) {
                    allBusinesses.set(key, {
                        name: biz.name,
                        appearances: 0,
                        avgRank: 0,
                        bestRank: Infinity,
                        worstRank: 0,
                        rating: biz.rating,
                        reviews: biz.reviews,
                        category: biz.category,
                        allCategories: biz.allCategories,
                        profileCompleteness: biz.profileCompleteness,
                        cid: biz.cid,
                        placeId: biz.placeId,
                        address: biz.address,
                        phone: biz.phone,
                        website: biz.website,
                        isSAB: biz.isSAB,
                        businessProfileId: biz.businessProfileId,
                        photosCount: biz.photosCount
                    });
                }

                const profile = allBusinesses.get(key)!;
                profile.appearances++;
                profile.avgRank = ((profile.avgRank * (profile.appearances - 1)) + biz.rank) / profile.appearances;
                profile.bestRank = Math.min(profile.bestRank, biz.rank);
                profile.worstRank = Math.max(profile.worstRank, biz.rank);

                // Update with latest data if available
                if (biz.rating !== undefined) profile.rating = biz.rating;
                if (biz.reviews !== undefined) profile.reviews = biz.reviews;
                if (biz.cid) profile.cid = biz.cid;
                if (biz.placeId) profile.placeId = biz.placeId;
                if (biz.businessProfileId) profile.businessProfileId = biz.businessProfileId;
                if (biz.photosCount) profile.photosCount = Math.max(profile.photosCount || 0, biz.photosCount);

                // Process categories
                if (biz.allCategories && biz.allCategories.length > 0) {
                    categoryCountPerBusiness.push(biz.allCategories.length);

                    biz.allCategories.forEach(cat => {
                        if (!allCategories.has(cat)) {
                            allCategories.set(cat, {
                                category: cat,
                                count: 0,
                                percentage: 0,
                                avgRating: 0,
                                avgReviews: 0
                            });
                        }
                        const catData = allCategories.get(cat)!;
                        catData.count++;
                        if (biz.rating !== undefined) {
                            catData.avgRating = ((catData.avgRating * (catData.count - 1)) + biz.rating) / catData.count;
                        }
                        if (biz.reviews !== undefined) {
                            catData.avgReviews = ((catData.avgReviews * (catData.count - 1)) + biz.reviews) / catData.count;
                        }
                    });
                } else if (biz.category) {
                    categoryCountPerBusiness.push(1);
                    if (!allCategories.has(biz.category)) {
                        allCategories.set(biz.category, {
                            category: biz.category,
                            count: 0,
                            percentage: 0,
                            avgRating: 0,
                            avgReviews: 0
                        });
                    }
                    allCategories.get(biz.category)!.count++;
                }

                // Review metrics
                if (biz.rating !== undefined) {
                    totalRating += biz.rating;
                    ratingCount++;
                    const ratingKey = Math.floor(biz.rating).toString();
                    if (ratingDistribution[ratingKey] !== undefined) {
                        ratingDistribution[ratingKey]++;
                    }
                } else {
                    ratingDistribution['none']++;
                }

                if (biz.reviews !== undefined) {
                    totalReviews += biz.reviews;
                    reviewCount++;
                    maxReviews = Math.max(maxReviews, biz.reviews);
                    minReviews = Math.min(minReviews, biz.reviews);
                    if (biz.reviews === 0) withoutReviews++;
                }

                // Profile metrics
                if (biz.phone) withPhone++;
                if (biz.website) withWebsite++;
                if (biz.address) withAddress++;
                if (biz.isSAB) sabCount++;
                if (biz.profileCompleteness !== undefined) {
                    totalCompleteness += biz.profileCompleteness;
                    completenessCount++;
                }
            });
        } catch (e) {
            // Skip malformed results
        }
    });

    // Calculate final metrics using unique businesses only
    const uniqueBusinesses = Array.from(allBusinesses.values());
    const totalBusinesses = uniqueBusinesses.length;

    // Sort competitors by appearances (dominance)
    const competitors = uniqueBusinesses
        .sort((a, b) => b.appearances - a.appearances);

    // Calculate category percentages and sort
    const totalCategoryOccurrences = Array.from(allCategories.values()).reduce((sum, c) => sum + c.count, 0);
    const topCategories = Array.from(allCategories.values())
        .map(c => ({
            ...c,
            percentage: totalCategoryOccurrences > 0 ? (c.count / totalCategoryOccurrences) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

    const categoryMetrics: CategoryMetrics = {
        totalCategories: allCategories.size,
        avgCategoriesPerBusiness: categoryCountPerBusiness.length > 0
            ? categoryCountPerBusiness.reduce((a, b) => a + b, 0) / categoryCountPerBusiness.length
            : 0,
        maxCategories: Math.max(...categoryCountPerBusiness, 0),
        topCategories,
        categoryGaps: [] // Would need target business categories to calculate
    };

    const reviewMetrics: ReviewMetrics = {
        avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        avgReviews: reviewCount > 0 ? totalReviews / reviewCount : 0,
        totalReviews,
        maxReviews,
        minReviews: minReviews === Infinity ? 0 : minReviews,
        withoutReviews,
        ratingDistribution
    };

    // Profile metrics: count from UNIQUE businesses only (not per-appearance)
    const profileMetrics: ProfileMetrics = {
        avgCompleteness: uniqueBusinesses.length > 0
            ? uniqueBusinesses.reduce((sum, b) => sum + (b.profileCompleteness || 0), 0) / uniqueBusinesses.length
            : 0,
        withPhone: uniqueBusinesses.filter(b => b.phone).length,
        withWebsite: uniqueBusinesses.filter(b => b.website).length,
        withAddress: uniqueBusinesses.filter(b => b.address).length,
        servicAreaBusinesses: uniqueBusinesses.filter(b => b.isSAB).length,
        physicalLocations: uniqueBusinesses.filter(b => !b.isSAB).length
    };

    return {
        competitors,
        categoryMetrics,
        reviewMetrics,
        profileMetrics
    };
}

/**
 * Generate actionable insights from analysis data
 */


/**
 * Generate review link for a business
 */
export function generateReviewLink(placeId: string): string {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/**
 * Convert CID to Place ID format URL
 */
export function cidToMapsUrl(cid: string): string {
    return `https://maps.google.com/?cid=${cid}`;
}

/**
 * Extract CID from various Google URL formats
 */
export function extractCidFromUrl(url: string): string | null {
    // Format 1: ?cid=123456789
    const cidParam = url.match(/[?&]cid=(\d+)/);
    if (cidParam) return cidParam[1];

    // Format 2: 0x...:0x(hex) - needs conversion
    const hexMatch = url.match(/0x[\da-fA-F]+:0x([\da-fA-F]+)/);
    if (hexMatch) {
        try {
            return BigInt('0x' + hexMatch[1]).toString();
        } catch {
            return hexMatch[1];
        }
    }

    return null;
}

/**
 * Extract Place ID from various Google URL formats
 */
export function extractPlaceIdFromUrl(url: string): string | null {
    // Format 1: place_id=...
    const placeIdParam = url.match(/place_id=([^&]+)/);
    if (placeIdParam) return decodeURIComponent(placeIdParam[1]);

    // Format 2: !19s(place_id)
    const embed = url.match(/!19s([^!]+)/);
    if (embed) return decodeURIComponent(embed[1]);

    // Format 3: ftid=...
    const ftid = url.match(/ftid=([^&]+)/);
    if (ftid) return decodeURIComponent(ftid[1]);

    return null;
}
