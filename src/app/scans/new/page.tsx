'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Grid, MoveHorizontal } from 'lucide-react';

export default function NewScanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        keyword: '',
        address: '',
        radius: 5,
        gridSize: 3,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // API call to create scan
        try {
            const res = await fetch('/api/scans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const scan = await res.json();
                router.push(`/scans/${scan.id}`);
            }
        } catch (error) {
            console.error('Failed to create scan:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen p-8 max-w-3xl mx-auto">
            <header className="mb-12">
                <h1 className="text-3xl font-bold mb-2">New Local Scan</h1>
                <p className="text-gray-400">Configure your grid and target keyword</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                            <Search size={16} /> Target Keyword
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. coffee shop, junk car buyer"
                            className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            value={formData.keyword}
                            onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                            <MapPin size={16} /> Center Location / Address
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Chicago, IL"
                            className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                                <MoveHorizontal size={16} /> Radius (km)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="50"
                                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={formData.radius}
                                onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                                <Grid size={16} /> Grid Size
                            </label>
                            <select
                                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={formData.gridSize}
                                onChange={(e) => setFormData({ ...formData, gridSize: parseInt(e.target.value) })}
                            >
                                <option value={3}>3 x 3 (9 points)</option>
                                <option value={5}>5 x 5 (25 points)</option>
                                <option value={7}>7 x 7 (49 points)</option>
                                <option value={9}>9 x 9 (81 points)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20"
                >
                    {loading ? 'Initializing Engine...' : 'Start Grid Scan'}
                </button>
            </form>
        </main>
    );
}
