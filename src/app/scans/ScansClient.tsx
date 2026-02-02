'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { exportAllScansToXLSX } from '@/lib/export';
import { Search, ChevronRight, Filter, Download, Plus, Calendar, MapPin, Grid, BarChart3, MoreVertical, Trash2, RefreshCw } from 'lucide-react';
import { Button, Badge, Card, Input, Select } from '@/components/ui';
import { useRouter } from 'next/navigation';

interface Scan {
    id: string;
    keyword: string;
    status: string;
    gridSize: number;
    radius: number;
    frequency: string;
    createdAt: string | Date;
    centerLat: number;
    centerLng: number;
}

export default function ScansPage({ initialScans }: { initialScans: Scan[] }) {
    const router = useRouter();
    const [scans, setScans] = useState<Scan[]>(initialScans);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this report?')) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/scans/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setScans(prev => prev.filter(s => s.id !== id));
            }
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleRerun = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Clear all results and rerun this scan?')) return;
        try {
            const res = await fetch(`/api/scans/${id}/rerun`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                router.push(`/scans/${id}`);
            } else {
                alert(`Rerun Failed: ${data.details || data.error || 'Unknown error'}`);
            }
        } catch (err: any) {
            console.error('Rerun failed:', err);
            alert(`Rerun Failed: ${err.message}`);
        }
    };

    const filteredScans = useMemo(() => {
        return scans
            .filter(scan => {
                const matchesSearch = scan.keyword.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = statusFilter === 'all' || scan.status.toLowerCase() === statusFilter.toLowerCase();
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                if (sortBy === 'keyword') return a.keyword.localeCompare(b.keyword);
                return 0;
            });
    }, [scans, searchQuery, statusFilter, sortBy]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <MapPin size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Rank Tracker</h1>
                    </div>
                    <p className="text-xs text-gray-500 font-bold ml-1 uppercase tracking-widest opacity-70">Spatial Intelligence Grid Network</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => exportAllScansToXLSX(filteredScans)}
                        className="h-11 px-5 border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-all font-bold"
                    >
                        <Download className="mr-2 w-4 h-4" /> Export All
                    </Button>
                    <Link href="/scans/new">
                        <Button className="h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-black uppercase text-xs tracking-widest">
                            <Plus className="mr-2 w-4 h-4" /> New Ranking Report
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters & Search - Re-designed for Premium Feel */}
            <Card className="p-1.5 flex flex-col lg:flex-row gap-2 border-none shadow-xl ring-1 ring-gray-200 bg-white/80 backdrop-blur-md">
                <div className="flex-1 relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search keywords, points, or status..."
                        className="w-full h-12 pl-12 pr-4 bg-gray-50/50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-medium text-gray-900 text-sm placeholder:text-gray-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap md:flex-nowrap gap-2">
                    <div className="w-full md:w-44">
                        <select
                            className="w-full h-12 px-4 bg-gray-50/50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-bold text-gray-700 text-xs uppercase tracking-wider cursor-pointer appearance-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="running">Running</option>
                            <option value="completed">Completed</option>
                            <option value="stopped">Stopped</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    <div className="w-full md:w-44">
                        <select
                            className="w-full h-12 px-4 bg-gray-50/50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all font-bold text-gray-700 text-xs uppercase tracking-wider cursor-pointer appearance-none"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="keyword">Alphabetical</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Data Table View */}
            <Card noPadding className="overflow-hidden border-none shadow-xl ring-1 ring-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keyword / Target</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Configuration</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location Info</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredScans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-gray-100">
                                                <Search size={24} className="text-gray-300" />
                                            </div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">No Reports Found</h3>
                                            <p className="text-gray-400 mt-1 text-xs font-medium">Try adjusting your search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredScans.map((scan) => (
                                    <tr key={scan.id} className="group hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                scan.status === 'COMPLETED' ? 'success' :
                                                    scan.status === 'RUNNING' ? 'blue' :
                                                        'default'
                                            } className="font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                                                {scan.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/scans/${scan.id}`} className="block group/link">
                                                <div className="font-bold text-gray-900 group-hover/link:text-blue-600 transition-colors line-clamp-1">
                                                    {scan.keyword}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                    Created {new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center text-[11px] text-gray-700 font-bold bg-gray-100 px-2 py-1 rounded-md">
                                                    <Grid size={11} className="mr-1.5 opacity-50" />
                                                    {scan.gridSize}x{scan.gridSize}
                                                </div>
                                                <div className="flex items-center text-[11px] text-gray-700 font-bold bg-gray-100 px-2 py-1 rounded-md">
                                                    <BarChart3 size={11} className="mr-1.5 opacity-50" />
                                                    {scan.radius}km
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-xs text-gray-500 font-medium">
                                                <MapPin size={12} className="mr-2 text-blue-500 shrink-0" />
                                                <span className="truncate max-w-[150px]">{scan.centerLat.toFixed(4)}, {scan.centerLng.toFixed(4)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/scans/${scan.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600">
                                                        View Results
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => handleRerun(scan.id, e)}
                                                    className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                                                >
                                                    <RefreshCw size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => handleDelete(scan.id, e)}
                                                    isLoading={isDeleting === scan.id}
                                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
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
