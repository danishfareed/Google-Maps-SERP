import React, { useMemo } from 'react';
import { Card } from '@/components/ui';
import { Brain, TrendingUp, AlertTriangle, Trophy, Zap, Target, Shield, ArrowRight, Activity, Users, Gauge } from 'lucide-react';
import type { CompetitorProfile, CategoryMetrics, ReviewMetrics } from '@/lib/analysis';
import {
    generateInsights,
    type CompetitorData,
    type InsightResult
} from '@/lib/insightEngine';

interface StrategicAnalysisProps {
    competitors: CompetitorProfile[];
    categoryMetrics: CategoryMetrics;
    reviewMetrics: ReviewMetrics;
}

export function StrategicAnalysis({ competitors, categoryMetrics, reviewMetrics }: StrategicAnalysisProps) {
    // Convert to insight engine format and generate insights
    const insights: InsightResult | null = useMemo(() => {
        if (!competitors.length) return null;

        const competitorData: CompetitorData[] = competitors.map(c => ({
            name: c.name,
            rank: c.avgRank,
            rating: c.rating,
            reviews: c.reviews,
            address: c.address,
            category: c.category,
            profileCompleteness: c.profileCompleteness,
            isSAB: c.isSAB,
            yearsInBusiness: c.yearsInBusiness,
            appearances: c.appearances
        }));

        return generateInsights(competitorData, competitors.length, undefined);
    }, [competitors]);

    if (!competitors.length || !insights) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                <Brain className="mx-auto text-gray-400 mb-2" size={32} />
                <h3 className="font-semibold text-gray-900">No Insights Available</h3>
                <p className="text-sm text-gray-500">Not enough competitor data to generate strategic insights.</p>
            </div>
        );
    }

    // Market maturity analysis (existing logic enhanced)
    const totalReviews = reviewMetrics.totalReviews;
    const avgRating = competitors.reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.length;
    const hasDominantPlayer = competitors.some(c => c.reviews > totalReviews * 0.4);

    let marketStage = {
        title: "Established Market",
        description: "High review volume and stable leaders. Disruption requires niche differentiation.",
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: Trophy
    };

    if (totalReviews < 100) {
        marketStage = {
            title: "Emerging Market",
            description: "Low competition volume. High opportunity for rapid dominance via review acquisition.",
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-200",
            icon: Zap
        };
    } else if (hasDominantPlayer) {
        marketStage = {
            title: "Monopolized Market",
            description: "One dominant player holds >40% of social proof. Direct confrontation is costly.",
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-200",
            icon: Target
        };
    } else if (avgRating < 4.2) {
        marketStage = {
            title: "Volatile Market",
            description: "Customer satisfaction is inconsistent. Quality service can easily capture market share.",
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
            icon: AlertTriangle
        };
    }

    // Threat level styling
    const threatStyles = {
        low: { bg: 'bg-green-500', text: 'text-green-600', label: 'Low Threat' },
        medium: { bg: 'bg-amber-500', text: 'text-amber-600', label: 'Medium Threat' },
        high: { bg: 'bg-orange-500', text: 'text-orange-600', label: 'High Threat' },
        critical: { bg: 'bg-red-500', text: 'text-red-600', label: 'Critical Threat' }
    };

    const threatStyle = threatStyles[insights.threatLevel];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Threat Level & Market Saturation Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Threat Level */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield size={18} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Threat Assessment</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className={`text-2xl font-black ${threatStyle.text.replace('text-', 'text-')}`} style={{ color: threatStyle.bg.replace('bg-', '') === 'green-500' ? '#22c55e' : threatStyle.bg.replace('bg-', '') === 'amber-500' ? '#f59e0b' : threatStyle.bg.replace('bg-', '') === 'orange-500' ? '#f97316' : '#ef4444' }}>
                                {insights.threatScore}
                            </p>
                            <p className="text-xs text-slate-400 font-bold uppercase mt-1">{threatStyle.label}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${threatStyle.bg} flex items-center justify-center`}>
                            <Activity size={24} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Market Saturation */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={18} className="text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Market Saturation</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-2xl font-black text-gray-900">{insights.marketSaturation}%</p>
                            <p className="text-xs text-gray-500 font-bold uppercase mt-1">
                                {insights.marketSaturation > 70 ? 'Highly Saturated' : insights.marketSaturation > 40 ? 'Moderate' : 'Low Competition'}
                            </p>
                        </div>
                        <div className="w-16 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${insights.marketSaturation > 70 ? 'bg-red-500' : insights.marketSaturation > 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                                style={{ width: `${insights.marketSaturation}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Market Stage */}
                <div className={`${marketStage.bg} rounded-2xl p-5 border ${marketStage.border}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <marketStage.icon size={18} className={marketStage.color} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${marketStage.color}`}>Market Stage</span>
                    </div>
                    <p className={`font-bold ${marketStage.color} text-lg`}>{marketStage.title}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{marketStage.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Threats */}
                <Card className="p-6 border-none ring-1 ring-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <AlertTriangle className="text-red-500" size={20} />
                        <h3 className="font-black text-gray-900">Top Competitor Threats</h3>
                    </div>
                    <div className="space-y-3">
                        {insights.topThreats.slice(0, 5).map((threat, i) => (
                            <div key={threat.name} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                            {i + 1}
                                        </span>
                                        <span className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{threat.name}</span>
                                    </div>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded ${threat.threatScore >= 60 ? 'bg-red-100 text-red-700' : threat.threatScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                        {threat.threatScore}
                                    </span>
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    {threat.strengthFactors.slice(0, 3).map((s, j) => (
                                        <span key={j} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Actionable Recommendations */}
                <Card className="p-6 border-none ring-1 ring-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <Brain className="text-emerald-600" size={20} />
                        <h3 className="font-black text-gray-900">Actionable Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                        {insights.recommendations.length > 0 ? (
                            insights.recommendations.map((rec, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${rec.estimatedImpact === 'high' ? 'bg-emerald-50 border-emerald-100' : rec.estimatedImpact === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${rec.estimatedImpact === 'high' ? 'bg-emerald-500' : rec.estimatedImpact === 'medium' ? 'bg-amber-500' : 'bg-gray-400'} text-white`}>
                                            <ArrowRight size={12} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm mb-1">{rec.action}</p>
                                            <p className="text-xs text-gray-600 leading-relaxed">{rec.reason}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Zap size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-bold">All optimized!</p>
                                <p className="text-xs">No urgent recommendations at this time.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Opportunities */}
            {insights.opportunities.length > 0 && (
                <Card className="p-6 border-none ring-1 ring-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <TrendingUp className="text-blue-600" size={20} />
                        <h3 className="font-black text-gray-900">Market Opportunities</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {insights.opportunities.map((opp, i) => (
                            <div key={i} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${opp.priority === 'high' ? 'text-emerald-600' : opp.priority === 'medium' ? 'text-amber-600' : 'text-gray-500'}`}>
                                        {opp.priority} priority
                                    </span>
                                    <span className="text-xs font-black text-blue-600">{opp.potentialImpact}%</span>
                                </div>
                                <p className="font-bold text-gray-900 text-sm mb-1">{opp.title}</p>
                                <p className="text-xs text-gray-600 leading-relaxed">{opp.description}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Category Dominance */}
            {insights.categoryDominance.length > 0 && (
                <Card className="p-6 border-none ring-1 ring-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <Gauge className="text-purple-600" size={20} />
                        <h3 className="font-black text-gray-900">Category Dominance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                    <th className="pb-3 pr-4">Category</th>
                                    <th className="pb-3 pr-4">Competitors</th>
                                    <th className="pb-3 pr-4">Avg Rating</th>
                                    <th className="pb-3 pr-4">Avg Reviews</th>
                                    <th className="pb-3">Dominant Player</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {insights.categoryDominance.slice(0, 6).map((cat, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="py-3 pr-4 font-bold text-gray-900">{cat.category}</td>
                                        <td className="py-3 pr-4 text-gray-600">{cat.competitorCount}</td>
                                        <td className="py-3 pr-4">
                                            <span className="text-amber-600 font-bold">{cat.avgRating}</span>
                                        </td>
                                        <td className="py-3 pr-4 text-gray-600">{cat.avgReviews}</td>
                                        <td className="py-3 text-gray-700 truncate max-w-[120px]">{cat.dominantPlayer}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

