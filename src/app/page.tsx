import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Search, Map as MapIcon, Plus, History } from 'lucide-react';

export default async function DashboardPage() {
    const scans = await prisma.scan.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        GMB Serp Tracker
                    </h1>
                    <p className="text-gray-400 mt-2">Local SEO Grid Rank Monitoring</p>
                </div>
                <Link
                    href="/scans/new"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-3 rounded-xl font-semibold"
                >
                    <Plus size={20} />
                    New Scan
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                            <Search size={24} />
                        </div>
                        <h3 className="text-xl font-semibold">Active Scans</h3>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <MapIcon size={24} />
                        </div>
                        <h3 className="text-xl font-semibold">Points Scanned</h3>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                            <History size={24} />
                        </div>
                        <h3 className="text-xl font-semibold">Total History</h3>
                    </div>
                    <p className="text-3xl font-bold">{scans.length}</p>
                </div>
            </div>

            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <History className="text-gray-400" size={24} />
                    Recent Scans
                </h2>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-800/50 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Keyword</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {scans.map((scan) => (
                                <tr key={scan.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium">{scan.keyword}</td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {new Date(scan.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scan.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                                                scan.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                                                    'bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {scan.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/scans/${scan.id}`}
                                            className="text-blue-400 hover:text-blue-300 font-medium"
                                        >
                                            View Report
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {scans.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No scans found. Start your first local SEO audit!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
