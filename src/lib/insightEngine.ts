/**
 * Insight Engine - Advanced Competitor Analysis
 * 
 * This module provides sophisticated analysis algorithms for local SEO intelligence.
 * It calculates market saturation, competitor strength, and actionable recommendations.
 */

export interface CompetitorData {
    name: string;
    rank?: number;
    rating?: number;
    reviews?: number;
    address?: string;
    category?: string;
    profileCompleteness?: number;
    isSAB?: boolean;
    yearsInBusiness?: number;
    appearances?: number;
}

export interface InsightResult {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    threatScore: number;
    marketSaturation: number;
    topThreats: CompetitorThreat[];
    opportunities: Opportunity[];
    recommendations: Recommendation[];
    categoryDominance: CategoryAnalysis[];
}

export interface CompetitorThreat {
    name: string;
    threatScore: number;
    avgRank: number;
    marketShare: number;
    strengthFactors: string[];
    weaknesses: string[];
}

export interface Opportunity {
    type: 'category' | 'geographic' | 'review' | 'profile';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    potentialImpact: number;
}

export interface Recommendation {
    action: string;
    reason: string;
    priority: number;
    estimatedImpact: 'low' | 'medium' | 'high';
}

export interface CategoryAnalysis {
    category: string;
    competitorCount: number;
    avgRating: number;
    avgReviews: number;
    dominantPlayer: string;
    yourPosition?: number;
}

/**
 * Calculate a comprehensive threat score for a competitor
 * Higher score = more threatening competitor
 */
export function calculateThreatScore(competitor: CompetitorData, totalAppearances: number): number {
    let score = 0;
    const maxScore = 100;

    // Ranking dominance (40% weight)
    const avgRank = competitor.rank ?? 21;
    if (avgRank <= 3) score += 40;
    else if (avgRank <= 5) score += 30;
    else if (avgRank <= 10) score += 20;
    else if (avgRank <= 15) score += 10;

    // Review power (25% weight)
    const reviews = competitor.reviews ?? 0;
    if (reviews >= 500) score += 25;
    else if (reviews >= 200) score += 20;
    else if (reviews >= 100) score += 15;
    else if (reviews >= 50) score += 10;
    else if (reviews >= 20) score += 5;

    // Rating quality (15% weight)
    const rating = competitor.rating ?? 0;
    if (rating >= 4.8) score += 15;
    else if (rating >= 4.5) score += 12;
    else if (rating >= 4.0) score += 8;
    else if (rating >= 3.5) score += 4;

    // Market presence (20% weight)
    const appearances = competitor.appearances ?? 0;
    const presenceRatio = totalAppearances > 0 ? appearances / totalAppearances : 0;
    score += Math.round(presenceRatio * 20);

    return Math.min(score, maxScore);
}

/**
 * Identify the strengths of a competitor
 */
export function identifyStrengths(competitor: CompetitorData): string[] {
    const strengths: string[] = [];

    if ((competitor.rating ?? 0) >= 4.5) strengths.push('High rating');
    if ((competitor.reviews ?? 0) >= 100) strengths.push('Strong review count');
    if ((competitor.rank ?? 21) <= 3) strengths.push('Top 3 ranking');
    if ((competitor.profileCompleteness ?? 0) >= 70) strengths.push('Complete profile');
    if ((competitor.yearsInBusiness ?? 0) >= 5) strengths.push('Established business');
    if (!competitor.isSAB) strengths.push('Physical location');

    return strengths;
}

/**
 * Identify the weaknesses of a competitor
 */
export function identifyWeaknesses(competitor: CompetitorData): string[] {
    const weaknesses: string[] = [];

    if ((competitor.rating ?? 0) < 4.0) weaknesses.push('Low rating');
    if ((competitor.reviews ?? 0) < 50) weaknesses.push('Few reviews');
    if ((competitor.profileCompleteness ?? 0) < 50) weaknesses.push('Incomplete profile');
    if (competitor.isSAB) weaknesses.push('No physical location');
    if (!competitor.address) weaknesses.push('Hidden address');

    return weaknesses;
}

/**
 * Calculate market saturation based on competitor density
 */
export function calculateMarketSaturation(competitors: CompetitorData[], gridPointCount: number): number {
    const uniqueCompetitors = new Set(competitors.map(c => c.name.toLowerCase())).size;
    const avgCompetitorsPerPoint = competitors.length / Math.max(gridPointCount, 1);

    // Saturation is high when there are many unique competitors AND high density
    let saturation = 0;

    if (uniqueCompetitors >= 50) saturation = 90;
    else if (uniqueCompetitors >= 30) saturation = 70;
    else if (uniqueCompetitors >= 15) saturation = 50;
    else if (uniqueCompetitors >= 8) saturation = 30;
    else saturation = 15;

    // Adjust for density
    if (avgCompetitorsPerPoint > 15) saturation = Math.min(saturation + 10, 100);

    return saturation;
}

/**
 * Generate actionable recommendations based on analysis
 */
export function generateRecommendations(
    yourProfile: CompetitorData | null,
    competitors: CompetitorData[],
    saturation: number
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Profile optimization
    if (yourProfile && (yourProfile.profileCompleteness ?? 0) < 70) {
        recommendations.push({
            action: 'Complete your Google Business Profile',
            reason: 'Your profile score is below optimal. Add missing information like photos, hours, and services.',
            priority: 1,
            estimatedImpact: 'high'
        });
    }

    // Review strategy
    const avgCompetitorReviews = competitors.reduce((sum, c) => sum + (c.reviews ?? 0), 0) / Math.max(competitors.length, 1);
    if (yourProfile && (yourProfile.reviews ?? 0) < avgCompetitorReviews * 0.5) {
        recommendations.push({
            action: 'Increase review generation efforts',
            reason: `Your review count is significantly below the market average of ${Math.round(avgCompetitorReviews)} reviews.`,
            priority: 2,
            estimatedImpact: 'high'
        });
    }

    // Market saturation advice
    if (saturation > 70) {
        recommendations.push({
            action: 'Focus on hyper-local targeting',
            reason: 'High market saturation detected. Consider targeting specific neighborhoods or sub-markets.',
            priority: 3,
            estimatedImpact: 'medium'
        });
    }

    // Rating improvement
    if (yourProfile && (yourProfile.rating ?? 0) < 4.5) {
        recommendations.push({
            action: 'Improve service quality to boost ratings',
            reason: 'A rating above 4.5 significantly increases click-through rates in local search.',
            priority: 4,
            estimatedImpact: 'medium'
        });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
}

/**
 * Analyze category dominance in the market
 */
export function analyzeCategoryDominance(competitors: CompetitorData[]): CategoryAnalysis[] {
    const categoryMap = new Map<string, CompetitorData[]>();

    for (const c of competitors) {
        if (c.category) {
            const existing = categoryMap.get(c.category) || [];
            existing.push(c);
            categoryMap.set(c.category, existing);
        }
    }

    const analysis: CategoryAnalysis[] = [];

    categoryMap.forEach((comps, category) => {
        const avgRating = comps.reduce((sum, c) => sum + (c.rating ?? 0), 0) / comps.length;
        const avgReviews = comps.reduce((sum, c) => sum + (c.reviews ?? 0), 0) / comps.length;

        // Find dominant player (lowest avg rank)
        const sorted = [...comps].sort((a, b) => (a.rank ?? 21) - (b.rank ?? 21));
        const dominant = sorted[0]?.name || 'Unknown';

        analysis.push({
            category,
            competitorCount: comps.length,
            avgRating: Math.round(avgRating * 10) / 10,
            avgReviews: Math.round(avgReviews),
            dominantPlayer: dominant
        });
    });

    return analysis.sort((a, b) => b.competitorCount - a.competitorCount);
}

/**
 * Find market opportunities based on competitor gaps
 */
export function findOpportunities(
    yourProfile: CompetitorData | null,
    competitors: CompetitorData[],
    categoryAnalysis: CategoryAnalysis[]
): Opportunity[] {
    const opportunities: Opportunity[] = [];

    // Review gap opportunity
    const avgReviews = competitors.reduce((sum, c) => sum + (c.reviews ?? 0), 0) / Math.max(competitors.length, 1);
    if (yourProfile && (yourProfile.reviews ?? 0) >= avgReviews * 1.5) {
        opportunities.push({
            type: 'review',
            title: 'Review Leader Advantage',
            description: 'You have significantly more reviews than competitors. Leverage this in your marketing.',
            priority: 'high',
            potentialImpact: 85
        });
    }

    // Category opportunity
    for (const cat of categoryAnalysis) {
        if (cat.competitorCount < 3 && cat.avgReviews < 50) {
            opportunities.push({
                type: 'category',
                title: `Low Competition: ${cat.category}`,
                description: `This category has few competitors and low review counts. Good opportunity for differentiation.`,
                priority: 'medium',
                potentialImpact: 60
            });
        }
    }

    // Profile gap
    const competitorsWithLowProfiles = competitors.filter(c => (c.profileCompleteness ?? 0) < 50).length;
    if (competitorsWithLowProfiles > competitors.length * 0.6) {
        opportunities.push({
            type: 'profile',
            title: 'Profile Optimization Opportunity',
            description: 'Most competitors have incomplete profiles. A well-optimized profile can give you a significant edge.',
            priority: 'high',
            potentialImpact: 70
        });
    }

    return opportunities.sort((a, b) => b.potentialImpact - a.potentialImpact);
}

/**
 * Main analysis function - generates comprehensive insights
 */
export function generateInsights(
    competitors: CompetitorData[],
    gridPointCount: number,
    yourProfile?: CompetitorData | null
): InsightResult {
    // Calculate market saturation
    const marketSaturation = calculateMarketSaturation(competitors, gridPointCount);

    // Calculate threat scores for all competitors
    const threatsWithScores = competitors.map(c => ({
        ...c,
        threatScore: calculateThreatScore(c, gridPointCount)
    })).sort((a, b) => b.threatScore - a.threatScore);

    // Get top threats
    const topThreats: CompetitorThreat[] = threatsWithScores.slice(0, 5).map(c => ({
        name: c.name,
        threatScore: c.threatScore,
        avgRank: c.rank ?? 21,
        marketShare: ((c.appearances ?? 0) / Math.max(gridPointCount, 1)) * 100,
        strengthFactors: identifyStrengths(c),
        weaknesses: identifyWeaknesses(c)
    }));

    // Analyze categories
    const categoryDominance = analyzeCategoryDominance(competitors);

    // Find opportunities
    const opportunities = findOpportunities(yourProfile ?? null, competitors, categoryDominance);

    // Generate recommendations
    const recommendations = generateRecommendations(yourProfile ?? null, competitors, marketSaturation);

    // Determine overall threat level
    const avgThreatScore = topThreats.reduce((sum, t) => sum + t.threatScore, 0) / Math.max(topThreats.length, 1);
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (avgThreatScore >= 75) threatLevel = 'critical';
    else if (avgThreatScore >= 55) threatLevel = 'high';
    else if (avgThreatScore >= 35) threatLevel = 'medium';

    return {
        threatLevel,
        threatScore: Math.round(avgThreatScore),
        marketSaturation,
        topThreats,
        opportunities,
        recommendations,
        categoryDominance
    };
}
