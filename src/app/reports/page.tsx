import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { BarChart3, Download, TrendingUp, Calendar, MapPin, Search } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';

export default async function ReportsPage() {
    const reports = await prisma.scan.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: { results: true }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <BarChart3 size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Reports Library</h1>
                    </div>
                    <p className="text-xs text-gray-500 font-bold ml-1 uppercase tracking-widest opacity-70">Historical Ranking Intelligence</p>
                </div>
            </header>

            <Card noPadding className="overflow-hidden border-none shadow-xl ring-1 ring-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Keyword</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Scan Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Config</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-gray-100">
                                                <BarChart3 size={24} className="text-gray-300" />
                                            </div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">No Reports Found</h3>
                                            <p className="text-gray-400 mt-1 text-xs font-medium">Completed scans will appear here.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reports.map(report => {
                                    const completedPoints = report.results.length;
                                    const top3Count = report.results.filter(r => r.rank && r.rank <= 3).length;
                                    const visibility = completedPoints > 0 ? Math.round((top3Count / completedPoints) * 100) : 0;

                                    return (
                                        <tr key={report.id} className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link href={`/scans/${report.id}`} className="block group/link">
                                                    <div className="font-bold text-gray-900 group-hover/link:text-blue-600 transition-colors">
                                                        {report.keyword}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                                                        <MapPin size={10} />
                                                        {report.centerLat.toFixed(3)}, {report.centerLng.toFixed(3)}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-600 font-medium">
                                                    {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center">
                                                    <Badge variant="outline" className="font-bold text-[10px] border-gray-100">
                                                        {report.gridSize}x{report.gridSize} Grid
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between items-center w-24">
                                                        <span className="text-[10px] font-black text-emerald-600">{visibility}%</span>
                                                        <span className="text-[9px] text-gray-400 uppercase font-bold">Visibility</span>
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${visibility}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/scans/${report.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600">
                                                            View Report
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                                        <Download size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
}
