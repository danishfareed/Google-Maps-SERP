'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import {
    Terminal,
    RefreshCw,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Info,
    Bug,
    Filter
} from 'lucide-react';

interface SystemLog {
    id: string;
    level: string;
    message: string;
    source: string;
    details: string | null;
    createdAt: string;
}

export function Telemetry() {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<string>('all');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = '/api/logs?limit=100';
            if (filterLevel !== 'all') url += `&level=${filterLevel}`;
            if (filterSource !== 'all') url += `&source=${filterSource}`;

            const res = await fetch(url);
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000);
        return () => clearInterval(interval);
    }, [filterLevel, filterSource]);

    const clearLogs = async () => {
        if (!confirm('Are you sure you want to clear all system logs?')) return;
        try {
            await fetch('/api/logs', { method: 'DELETE' });
            setLogs([]);
        } catch (error) {
            alert('Failed to clear logs');
        }
    };

    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'ERROR': return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 font-bold px-2 py-0 h-5 text-[10px]"><AlertCircle size={10} className="mr-1" /> {level}</Badge>;
            case 'WARN': return <Badge variant="warning" className="bg-amber-500 hover:bg-amber-600 font-bold px-2 py-0 h-5 text-[10px]"><Info size={10} className="mr-1" /> {level}</Badge>;
            case 'INFO': return <Badge variant="blue" className="bg-blue-500 hover:bg-blue-600 font-bold px-2 py-0 h-5 text-[10px]"><CheckCircle2 size={10} className="mr-1" /> {level}</Badge>;
            case 'DEBUG': return <Badge variant="outline" className="border-gray-200 text-gray-400 font-bold px-2 py-0 h-5 text-[10px]"><Bug size={10} className="mr-1" /> {level}</Badge>;
            default: return <Badge variant="outline" className="px-2 py-0 h-5 text-[10px]">{level}</Badge>;
        }
    };

    const sources = Array.from(new Set(['SCANNER', 'PROXY_FETCHER', 'API', 'SYSTEM']));

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <Terminal className="text-blue-600" size={24} />
                        System Intelligence Logs
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm font-medium">Real-time telemetry and process debugging console.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchLogs} className="h-9 px-4 font-bold uppercase tracking-wider text-xs border-2">
                        <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearLogs} className="h-9 px-4 font-bold uppercase tracking-wider text-xs text-red-500 hover:bg-red-50">
                        <Trash2 size={14} className="mr-2" />
                        Clear All
                    </Button>
                </div>
            </div>

            <Card className="p-0 border-none shadow-xl shadow-gray-200/50 overflow-hidden ring-1 ring-gray-200 bg-white">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filters:</span>
                    </div>

                    <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="text-xs font-bold bg-white border border-gray-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none h-9"
                    >
                        <option value="all">All Levels</option>
                        <option value="INFO">Info</option>
                        <option value="WARN">Warning</option>
                        <option value="ERROR">Error</option>
                        <option value="DEBUG">Debug</option>
                    </select>

                    <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                        className="text-xs font-bold bg-white border border-gray-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none h-9"
                    >
                        <option value="all">All Sources</option>
                        {sources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <div className="ml-auto text-[10px] font-mono text-gray-400 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        LIVE TELEMETRY
                    </div>
                </div>

                <div className="bg-[#1e1e1e] overflow-x-auto min-h-[500px] max-h-[600px] overflow-y-auto font-mono text-[13px] custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-gray-600">
                            <Terminal size={48} className="mb-4 opacity-20" />
                            <p className="font-bold uppercase tracking-widest">Console Empty</p>
                            <p className="text-xs mt-1">No system events recorded yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#2d2d2d] text-gray-400 font-bold uppercase text-[10px] tracking-widest z-10 shadow-md">
                                <tr>
                                    <th className="p-3 w-48">Timestamp</th>
                                    <th className="p-3 w-32">Level</th>
                                    <th className="p-3 w-40">Source</th>
                                    <th className="p-3">Message / Payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#333]">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-[#252525] transition-colors group">
                                        <td className="p-3 text-gray-500 whitespace-nowrap text-[11px]">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-3">
                                            {getLevelBadge(log.level)}
                                        </td>
                                        <td className="p-3">
                                            <span className="bg-[#333] text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                                {log.source || 'SYSTEM'}
                                            </span>
                                        </td>
                                        <td className="p-3 leading-relaxed">
                                            <p className={`${log.level === 'ERROR' ? 'text-red-400 font-bold' : 'text-gray-300'} text-[12px]`}>
                                                {log.message}
                                            </p>
                                            {log.details && (
                                                <details className="mt-2 outline-none">
                                                    <summary className="text-[10px] text-blue-500 cursor-pointer hover:underline font-bold uppercase tracking-tighter outline-none">
                                                        Inspect Payload
                                                    </summary>
                                                    <pre className="mt-2 p-3 bg-black/50 rounded-lg text-emerald-400 overflow-x-auto text-[11px] border border-[#444]">
                                                        {JSON.stringify(JSON.parse(log.details), null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    );
}
