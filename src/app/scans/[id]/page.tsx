import { prisma } from '@/lib/prisma';
import { MapPin, Calendar, Target, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ScanReportPage({ params }: { params: { id: string } }) {
    const scan = await prisma.scan.findUnique({
        where: { id: params.id },
        include: { results: true },
    });

    if (!scan) return <div className="p-8">Scan not found</div>;

    return (
        <main className="min-h-screen p-8 max-w-7xl mx-auto">
            <header className="mb-12">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                >
                    <ChevronLeft size={20} />
                    Back to Dashboard
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">"{scan.keyword}"</h1>
                        <div className="flex gap-6 text-gray-400">
                            <span className="flex items-center gap-2">
                                <Calendar size={18} /> {new Date(scan.createdAt).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-2">
                                <MapPin size={18} /> {scan.centerLat.toFixed(4)}, {scan.centerLng.toFixed(4)}
                            </span>
                            <span className="flex items-center gap-2 text-blue-400 font-semibold">
                                <Target size={18} /> {scan.gridSize}x{scan.gridSize} Grid
                            </span>
                        </div>
                    </div>
                    <div className={`px-6 py-2 rounded-full font-bold ${scan.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                        }`}>
                        {scan.status}
                    </div>
                </div>
            </header>

            {/* Grid Visualization */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 overflow-auto flex justify-center items-center gap-4">
                <div
                    className="grid gap-4"
                    style={{
                        gridTemplateColumns: `repeat(${scan.gridSize}, minmax(0, 1fr))`,
                        width: 'fit-content'
                    }}
                >
                    {Array.from({ length: scan.gridSize * scan.gridSize }).map((_, i) => {
                        const result = scan.results[i];
                        return (
                            <div
                                key={i}
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl cursor-help transition-all transform hover:scale-110 shadow-lg ${result ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40' : 'bg-zinc-800 text-zinc-600 border-2 border-zinc-700'
                                    }`}
                                title={result ? `Lat: ${result.lat}\nLng: ${result.lng}` : 'Pending...'}
                            >
                                {result ? (i + 1) : '?'}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Results Table (Optional detail) */}
            <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Point Statistics</h2>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    {/* Add dynamic result details here */}
                    <p className="p-6 text-gray-400 italic">Click a point on the grid above (Interactive features coming soon)</p>
                </div>
            </section>
        </main>
    );
}
