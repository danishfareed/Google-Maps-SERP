'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Plus, ArrowUpRight, TrendingUp, Users, Target, Calendar, BarChart3, Search, MapPin, Activity, ArrowRight, List, Zap } from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '@/components/ui';
import { LookbackNotifier } from '@/components/dashboard/LookbackNotifier';

interface Scan {
    id: string;
    keyword: string;
    status: string;
    gridSize: number;
    radius: number;
    frequency: string;
    createdAt: string;
    centerLat: number;
    centerLng: number;
}

interface DashboardData {
    scansCount: number;
    recentScans: Scan[];
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <LookbackNotifier />

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <LayoutDashboard size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Command Center</h1>
                    </div>
                    <p className="text-xs text-gray-500 font-bold ml-1 uppercase tracking-widest opacity-70">Spatial Performance Overview</p>
                </div>
                <Link href="/scans/new">
                    <Button className="h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-black uppercase text-xs tracking-widest">
                        <Plus className="mr-2 w-4 h-4" /> New Ranking Report
                    </Button>
                </Link>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 card-hover h-full">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Scans</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{loading ? '-' : data?.scansCount}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-emerald-600 font-medium flex items-center">
                            <TrendingUp size={14} className="mr-1" /> +12%
                        </span>
                        <span className="text-gray-400 ml-2">vs last month</span>
                    </div>
                </Card>

                <Card className="p-6 card-hover h-full">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg Visibility</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">42%</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <BarChart3 size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-emerald-600 font-medium flex items-center">
                            <TrendingUp size={14} className="mr-1" /> +5%
                        </span>
                        <span className="text-gray-400 ml-2">vs last month</span>
                    </div>
                </Card>

                <Card noPadding className="h-full bg-slate-900 text-white border-none shadow-lg shadow-slate-200 overflow-hidden relative group md:col-span-2">
                    <div className="h-full p-6 flex flex-col justify-between relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1 bg-blue-500/20 rounded-md">
                                        <Zap size={14} className="text-blue-400 fill-blue-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Pro Tip</span>
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Category Optimization</h3>
                                <p className="text-slate-300 text-sm leading-relaxed max-w-[280px]">
                                    Increase visibility by refining your <strong className="text-white">GMB categories</strong> to match high-volume intent.
                                </p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg backdrop-blur-md group-hover:scale-110 transition-transform">
                                <List className="text-slate-400" size={20} />
                            </div>
                        </div>
                        <Link href="/help" className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-4 transition-colors">
                            Read Strategy Guide <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                        <Activity size={160} className="text-white" />
                    </div>
                </Card>
            </div>

            {/* Recent Scans Table */}
            <Card noPadding className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h2 className="text-lg font-bold text-gray-900">Recent Reports</h2>
                    <Link href="/scans" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Name / Keywords</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Frequency</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : data?.recentScans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No reports found. Start tracking now!
                                    </td>
                                </tr>
                            ) : (
                                data?.recentScans.map((scan) => (
                                    <tr key={scan.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <Search size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{scan.keyword}</div>
                                                    <div className="text-xs text-gray-500">{new Date(scan.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <MapPin size={14} className="mr-1 text-gray-400" />
                                                {scan.centerLat.toFixed(2)}, {scan.centerLng.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                {scan.frequency}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                scan.status === 'COMPLETED' ? 'success' :
                                                    scan.status === 'RUNNING' ? 'blue' : 'default'
                                            }>
                                                {scan.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/scans/${scan.id}`}>
                                                <Button variant="secondary" size="sm">
                                                    View Report
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
