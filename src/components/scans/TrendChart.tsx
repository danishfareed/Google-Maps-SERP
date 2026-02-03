'use client';

import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { Card } from '@/components/ui';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface TrendPoint {
    date: string;
    avgRank: number;
    top3Count: number;
    scanId: string;
}

interface TrendChartProps {
    keyword: string;
    businessName: string;
    currentScanId: string;
}

export function TrendChart({ keyword, businessName, currentScanId }: TrendChartProps) {
    const [data, setData] = useState<TrendPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!keyword || !businessName) return;

        fetch(`/api/scans/history?keyword=${encodeURIComponent(keyword)}&businessName=${encodeURIComponent(businessName)}`)
            .then(res => res.json())
            .then(result => {
                if (result.history) {
                    setData(result.history);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [keyword, businessName]);

    if (loading) {
        return (
            <Card className="p-6 flex items-center justify-center h-48">
                <RefreshCw className="animate-spin text-gray-400" size={24} />
            </Card>
        );
    }

    if (data.length < 2) {
        return (
            <Card className="p-6 bg-gray-50 border-dashed">
                <div className="text-center text-gray-500">
                    <TrendingUp className="mx-auto mb-2 opacity-40" size={32} />
                    <p className="text-sm font-medium">Trend data will appear after multiple scans</p>
                    <p className="text-xs text-gray-400 mt-1">Run recurring scans to track ranking changes over time</p>
                </div>
            </Card>
        );
    }

    // Calculate trend direction
    const firstAvg = data[0]?.avgRank || 0;
    const lastAvg = data[data.length - 1]?.avgRank || 0;
    const trendDiff = firstAvg - lastAvg;
    const trendDirection = trendDiff > 0.5 ? 'up' : trendDiff < -0.5 ? 'down' : 'stable';

    return (
        <Card className="p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-600" />
                        Ranking Trend
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Historical performance for "{keyword}"</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${trendDirection === 'up' ? 'bg-emerald-50 text-emerald-600' :
                        trendDirection === 'down' ? 'bg-red-50 text-red-600' :
                            'bg-gray-100 text-gray-500'
                    }`}>
                    {trendDirection === 'up' && <TrendingUp size={14} />}
                    {trendDirection === 'down' && <TrendingDown size={14} />}
                    {trendDirection === 'stable' && <Minus size={14} />}
                    {trendDirection === 'up' ? `+${Math.abs(trendDiff).toFixed(1)} Improved` :
                        trendDirection === 'down' ? `-${Math.abs(trendDiff).toFixed(1)} Dropped` :
                            'Stable'}
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                            domain={[1, 20]}
                            reversed
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickFormatter={(val) => `#${val}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: number) => [`#${value.toFixed(1)}`, 'Avg Rank']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        />
                        <ReferenceLine y={3} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Top 3', position: 'right', fontSize: 10, fill: '#10b981' }} />
                        <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Top 10', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
                        <Line
                            type="monotone"
                            dataKey="avgRank"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#1d4ed8' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex justify-center gap-6 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-blue-500 rounded" />
                    Average Position
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-emerald-500 rounded opacity-50" style={{ borderStyle: 'dashed' }} />
                    Target Zone
                </div>
            </div>
        </Card>
    );
}
