import { Card } from '@/components/ui';
import { TrendingUp } from 'lucide-react';

interface AIInsightsProps {
    avgRank: number;
    scan: any;
    totalPoints: number;
    competitors: any[];
}

export function AIInsights({ avgRank, scan, totalPoints, competitors }: AIInsightsProps) {
    return (
        <div>
            <Card className="p-8 bg-white relative overflow-hidden border border-indigo-100 shadow-xl shadow-indigo-500/5">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="shrink-0 flex flex-col items-center text-center md:items-start md:text-left">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm text-indigo-600 mb-3 border border-indigo-100">
                            <TrendingUp size={24} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Algorithmic Analysis</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Heuristic Performance Metrics</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                        {/* Observation 1: Market Position */}
                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Market Dominance</span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed text-gray-700">
                                {avgRank <= 5
                                    ? "You are effectively colonizing the top SERP positions in this radius. Your proximity-to-rank ratio is highly optimized."
                                    : avgRank <= 12
                                        ? "Strong presence detected, but fringe zones are susceptible to local pack displacement. Focus on localized citations."
                                        : "Visibility is currently limited to high-proximity clusters. Expansion requires aggressive keyword-velocity increases."}
                            </p>
                        </div>

                        {/* Observation 2: Dead Zones */}
                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Geographic Health</span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed text-gray-700">
                                {scan.results.filter((r: any) => !r.rank).length > (totalPoints * 0.4)
                                    ? "Critical 'Dead Zones' detected in over 40% of the grid. Competitors are out-leveraging your business in peripheral sectors."
                                    : "Your coverage is relatively uniform. No major 'Black Hole' zones detected within the current scan radius."}
                            </p>
                        </div>

                        {/* Observation 3: Opportunity */}
                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Competitive Threat</span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed text-gray-700">
                                {competitors && competitors.length > 0
                                    ? `Main threat: '${competitors[0].name}' dominates ${((competitors[0].appearances / totalPoints) * 100).toFixed(0)}% of the grid. Analyze their citation profile for local pack displacement strategy.`
                                    : "No major competitors detected within the Top 20 across the grid. You are virtually unchallenged in this keyword sector."}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
