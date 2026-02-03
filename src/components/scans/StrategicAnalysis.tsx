import React from 'react';
import { Card } from '@/components/ui';
import { Brain, TrendingUp, AlertTriangle, Trophy, Zap, Target } from 'lucide-react';
import type { CompetitorProfile, CategoryMetrics, ReviewMetrics } from '@/lib/analysis';

interface StrategicAnalysisProps {
    competitors: CompetitorProfile[];
    categoryMetrics: CategoryMetrics;
    reviewMetrics: ReviewMetrics;
}

export function StrategicAnalysis({ competitors, categoryMetrics, reviewMetrics }: StrategicAnalysisProps) {
    if (!competitors.length) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                <Brain className="mx-auto text-gray-400 mb-2" size={32} />
                <h3 className="font-semibold text-gray-900">No Insights Available</h3>
                <p className="text-sm text-gray-500">Not enough competitor data to generate strategic insights.</p>
            </div>
        );
    }

    // 1. Market Maturity Analysis
    const totalReviews = reviewMetrics.totalReviews;
    const avgRating = competitors.reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.length;
    const hasDominantPlayer = competitors.some(c => c.reviews > totalReviews * 0.4); // One player has > 40% of reviews

    let marketStage = {
        title: "Established Market",
        description: "High review volume and stable leaders. Disruption requires niche differentiation.",
        color: "text-blue-600",
        bg: "bg-blue-50",
        icon: Trophy
    };

    if (totalReviews < 100) {
        marketStage = {
            title: "Emerging Market",
            description: "Low competition volume. High opportunity for rapid dominance via review acquisition.",
            color: "text-green-600",
            bg: "bg-green-50",
            icon: Zap
        };
    } else if (hasDominantPlayer) {
        marketStage = {
            title: "Monopolized Market",
            description: "One dominance player holds >40% of social proof. Direct confrontation is costly.",
            color: "text-purple-600",
            bg: "bg-purple-50",
            icon: Target
        };
    } else if (avgRating < 4.2) {
        marketStage = {
            title: "Volatile Market",
            description: "Customer satisfaction is inconsistent. Quality service can easily capture market share.",
            color: "text-amber-600",
            bg: "bg-amber-50",
            icon: AlertTriangle
        };
    }

    // 2. Dominance Index Calculation
    // Score = (Rank Weight * 0.4) + (Review Share * 0.4) + (Rating Weight * 0.2)
    const dominanceScores = competitors.map(c => {
        const rankScore = Math.max(0, 21 - c.avgRank) / 20; // 1st = 1.0, 20th = 0.05
        const reviewShare = c.reviews / Math.max(1, reviewMetrics.maxReviews);
        const ratingScore = (c.rating || 0) / 5;

        return {
            ...c,
            score: (rankScore * 0.4) + (reviewShare * 0.4) + (ratingScore * 0.2)
        };
    }).sort((a, b) => b.score - a.score);

    const dominantLeader = dominanceScores[0];

    // 3. Vulnerability Detection (High Rank but Low Rating)
    const vulnerableLeaders = competitors
        .filter(c => c.avgRank <= 5 && (c.rating || 0) < 4.4)
        .map(c => ({ name: c.name, rating: c.rating, rank: c.avgRank }));

    // 4. Opportunity Gaps
    const opportunities = [];
    if (reviewMetrics.withoutReviews > 3) {
        opportunities.push("Several established listings have 0 reviews. Easy targets.");
    }
    if (categoryMetrics.avgCategoriesPerBusiness < 3) {
        opportunities.push("Competitors are under-optimizing categories. Add secondary categories to win.");
    }
    const competitorsWithoutPhotos = competitors.filter(c => (c.photosCount || 0) < 5).length;
    if (competitorsWithoutPhotos > 5) {
        opportunities.push(`${competitorsWithoutPhotos} top competitors have poor photo presence.`);
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Market Stage */}
            <div className={`p-6 rounded-2xl border ${marketStage.bg.replace('bg-', 'border-').replace('50', '200')} ${marketStage.bg}`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-white shadow-sm ${marketStage.color}`}>
                        <marketStage.icon size={24} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${marketStage.color} mb-1`}>{marketStage.title}</h3>
                        <p className="text-gray-700 leading-relaxed">{marketStage.description}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dominance Leaderboard */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Target className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-gray-900">Market Dominance Index</h3>
                    </div>
                    <div className="space-y-4">
                        {dominanceScores.slice(0, 5).map((c, i) => (
                            <div key={c.name} className="flex items-center gap-4">
                                <div className="text-sm font-bold text-gray-400 w-4">#{i + 1}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{c.name}</span>
                                        <span className="text-xs font-bold text-indigo-600">{(c.score * 100).toFixed(0)}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${c.score * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Strategic Opportunities */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Brain className="text-emerald-600" size={20} />
                        <h3 className="font-bold text-gray-900">Strategic Gaps</h3>
                    </div>

                    <div className="space-y-4">
                        {vulnerableLeaders.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase mb-1">
                                    <AlertTriangle size={12} />
                                    Vulnerable Leaders
                                </div>
                                <ul className="text-sm text-red-700 space-y-1 mt-1">
                                    {vulnerableLeaders.map(v => (
                                        <li key={v.name}>{v.name} (#{v.rank}) has low rating ({v.rating})</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {opportunities.length > 0 ? (
                            opportunities.map((opp, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <TrendingUp size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                    <span className="text-sm text-gray-700">{opp}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-500 italic text-center py-4">
                                No obvious gaps found. Highly competitive market.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
