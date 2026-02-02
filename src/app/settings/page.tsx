'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings as SettingsIcon, User, Bell, Database, Github, Plus, Trash2, CheckCircle2, Globe, Server, Shield, Zap, Info, Loader2, X, AlertCircle, Activity } from 'lucide-react';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { Telemetry } from '@/components/settings/Telemetry';

export default function SettingsPage() {
    const [name, setName] = useState('Local User');
    const [proxies, setProxies] = useState<any[]>([]);
    const [loadingProxies, setLoadingProxies] = useState(false);
    const [fetchLogs, setFetchLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(false);
    const [newProxy, setNewProxy] = useState({ host: '', port: '', username: '', password: '', type: 'RESIDENTIAL' });
    const [showAddProxy, setShowAddProxy] = useState(false);
    const [activeSection, setActiveSection] = useState<'general' | 'proxies' | 'providers' | 'notifications' | 'logs'>('general');
    const [useSystemProxy, setUseSystemProxy] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [checkingNotifications, setCheckingNotifications] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        const savedName = localStorage.getItem('gmbserp_user_name');
        if (savedName) setName(savedName);
        fetchProxies();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.settings) {
                if (data.settings.useSystemProxy !== undefined) {
                    setUseSystemProxy(data.settings.useSystemProxy === 'true');
                }
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    const persistSetting = async (key: string, value: string) => {
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            });
        } catch (err) {
            console.error('Failed to persist setting:', err);
        }
    };

    const fetchProxies = async () => {
        try {
            const res = await fetch('/api/proxies');
            const data = await res.json();
            setProxies(data.proxies || []);
        } catch (err) {
            console.error('Failed to fetch proxies:', err);
        }
    };

    const handleFetchPublic = async () => {
        setLoadingProxies(true);
        setShowLogs(true);
        setFetchLogs(['[INIT] Connecting to global proxy repositories...']);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 min total timeout

        try {
            const res = await fetch('/api/proxies/fetch', {
                method: 'POST',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                setFetchLogs(prev => [...prev, `[ERROR] Server returned ${res.status}: ${errorData.details || errorData.error || 'Unknown error'}`]);
                return;
            }

            const data = await res.json();
            if (data.success) {
                setFetchLogs(prev => [...prev, ...data.logs.map((l: string) => `[SUCCESS] ${l}`), `[FINAL] Sync complete.`]);
                setTimeout(fetchProxies, 1000);
            } else {
                setFetchLogs(prev => [...prev, `[ERROR] ${data.error || 'Operation failed'}`]);
            }
        } catch (err: any) {
            const msg = err.name === 'AbortError' ? 'Synchronization timed out' : err.message;
            setFetchLogs(prev => [...prev, `[ERROR] Connection failed: ${msg}`]);
        } finally {
            setLoadingProxies(false);
            clearTimeout(timeoutId);
        }
    };

    const handleAddProxy = async () => {
        if (!newProxy.host || !newProxy.port) {
            alert('Host and Port are required');
            return;
        }

        try {
            const res = await fetch('/api/proxies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProxy),
            });

            if (res.ok) {
                fetchProxies();
                setShowAddProxy(false);
                setNewProxy({ host: '', port: '', username: '', password: '', type: 'RESIDENTIAL' });
            } else {
                const data = await res.json();
                alert(`${data.error || 'Failed to add proxy'}${data.details ? `: ${data.details}` : ''}`);
            }
        } catch (err) {
            console.error('Failed to add proxy:', err);
            alert('Network error while adding proxy');
        }
    };

    const handleDeleteProxy = async (id: string) => {
        try {
            await fetch(`/api/proxies?id=${id}`, { method: 'DELETE' });
            fetchProxies();
        } catch (err) {
            console.error('Failed to delete proxy:', err);
        }
    };

    const handleToggleProxy = async (id: string, currentStatus: boolean) => {
        try {
            await fetch('/api/proxies', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, enabled: !currentStatus }),
            });
            fetchProxies();
        } catch (err) {
            console.error('Failed to toggle proxy:', err);
        }
    };

    const handleValidateProxies = async () => {
        setIsValidating(true);
        try {
            const res = await fetch('/api/proxies', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'VALIDATE_ALL' }),
            });
            const data = await res.json();
            if (data.success) {
                setFetchLogs(prev => [...prev, `[HEALTH] Validation complete: ${data.active} Active, ${data.dead} Dead.`]);
                setShowLogs(true);
                fetchProxies();
            }
        } catch (err) {
            console.error('Validation failed:', err);
        } finally {
            setIsValidating(false);
        }
    };

    const handlePurgePool = async () => {
        if (!confirm('Are you sure you want to purge the entire routing pool? This cannot be undone.')) return;
        try {
            await fetch('/api/proxies?id=all', { method: 'DELETE' });
            fetchProxies();
            setFetchLogs(['[WARN] Routing pool purged by operator.']);
            setShowLogs(true);
        } catch (err) {
            console.error('Failed to purge pool:', err);
        }
    };

    const handleNameChange = (newName: string) => {
        setName(newName);
        localStorage.setItem('gmbserp_user_name', newName);
    };

    const handleEnableNotifications = async () => {
        setCheckingNotifications(true);
        try {
            if (!("Notification" in window)) {
                alert("This browser does not support desktop notifications");
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                setNotificationsEnabled(true);
                new Notification("GeoRanker", { body: "Browser notifications enabled successfully!" });
            }
        } catch (err) {
            console.error("Notification error:", err);
        } finally {
            setCheckingNotifications(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 min-h-screen bg-gray-50 text-gray-900">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <SettingsIcon size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">System Configuration</h1>
                    </div>
                    <p className="text-xs text-gray-500 font-bold ml-1 uppercase tracking-widest opacity-70">Infrastructure & Spatial Routing Control</p>
                </div>
                <div className="flex gap-2 p-1.5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto custom-scrollbar">
                    {['general', 'proxies', 'providers', 'notifications', 'logs'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveSection(tab as any)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex-shrink-0 ${activeSection === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            {tab === 'logs' ? 'Telemetry' : tab}
                        </button>
                    ))}
                </div>
            </header>

            <main className="space-y-6">
                {activeSection === 'general' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        <Card className="p-8 border-none shadow-xl ring-1 ring-gray-200 bg-white">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Operator Profile</h3>
                                    <p className="text-sm text-gray-500 font-medium">Identity used for reporting</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-2 block">Display Name</label>
                                    <Input
                                        value={name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="h-12 font-bold border-gray-200 focus:ring-blue-500 bg-gray-50/50"
                                    />
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-4">
                                    <Info className="text-blue-500 shrink-0" size={18} />
                                    <p className="text-xs font-bold text-blue-700 leading-relaxed italic">
                                        This name will appear on all exported spatial reports and automated alerts sent to stakeholders.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 border-none shadow-xl ring-1 ring-gray-200 bg-white">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">System Preferences</h3>
                                    <p className="text-sm text-gray-500 font-medium">Core engine behavior</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-900">Auto-Retry Scans</p>
                                        <p className="text-xs text-gray-500">Retry up to 3 times on spatial failure.</p>
                                    </div>
                                    <input type="checkbox" defaultChecked className="w-6 h-6 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-900">Infinite History</p>
                                        <p className="text-xs text-gray-500">Never delete old scan records.</p>
                                    </div>
                                    <input type="checkbox" className="w-6 h-6 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500" />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeSection === 'proxies' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <Card className="p-8 border-none shadow-xl ring-1 ring-gray-200 bg-white">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <Globe size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Routing Intelligence</h3>
                                        <p className="text-sm text-gray-500 font-medium italic">Configure IP rotation to bypass local SERP detection.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleFetchPublic}
                                        disabled={loadingProxies}
                                        className="bg-gray-900 hover:bg-black text-white px-6 font-black uppercase text-[10px] tracking-widest h-11"
                                    >
                                        {loadingProxies ? <Loader2 size={16} className="animate-spin mr-2" /> : <Github size={16} className="mr-2" />}
                                        Auto-Configure Pool
                                    </Button>
                                    <Button
                                        onClick={handleValidateProxies}
                                        disabled={isValidating || proxies.length === 0}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-black uppercase text-[10px] tracking-widest h-11"
                                    >
                                        {isValidating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Activity size={16} className="mr-2" />}
                                        Validate Health
                                    </Button>
                                    <Button onClick={() => setShowAddProxy(!showAddProxy)} variant="outline" className="border-gray-200 font-black uppercase text-[10px] tracking-widest h-11 bg-white">
                                        Manual Entry
                                    </Button>
                                    <Button onClick={handlePurgePool} variant="outline" className="border-rose-100 text-rose-500 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest h-11 bg-white">
                                        <Trash2 size={16} className="mr-2" />
                                        Clear Pool
                                    </Button>
                                </div>
                            </div>

                            {showLogs && (
                                <div className="mb-8 bg-slate-900 rounded-2xl p-6 font-mono text-xs shadow-inner relative overflow-hidden ring-4 ring-slate-800">
                                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                        <span className="text-blue-400 font-black uppercase tracking-[3px] text-[10px]">Spatial Bridge Console v2.0</span>
                                        <button onClick={() => setShowLogs(false)} className="text-slate-600 hover:text-white transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-4">
                                        {fetchLogs.map((log, i) => (
                                            <div key={i} className="flex gap-4">
                                                <span className="text-slate-700 shrink-0 font-bold select-none">{String(i + 1).padStart(2, '0')}</span>
                                                <span className={`${log.includes('[ERROR]') ? 'text-rose-400' : log.includes('[SUCCESS]') || log.includes('[FINAL]') ? 'text-emerald-400' : 'text-slate-300'} font-medium`}>
                                                    {log}
                                                </span>
                                            </div>
                                        ))}
                                        {loadingProxies && (
                                            <div className="flex items-center gap-2 text-blue-400 font-black animate-pulse py-2">
                                                <Zap size={12} className="animate-bounce" />
                                                SYNCHRONIZING GLOBAL ENDPOINTS...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {showAddProxy && (
                                <div className="mb-8 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Host / IP</label>
                                            <Input placeholder="192.168.1.1" value={newProxy.host} onChange={e => setNewProxy({ ...newProxy, host: e.target.value })} className="font-bold border-gray-200" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Port</label>
                                            <Input placeholder="8080" value={newProxy.port} onChange={e => setNewProxy({ ...newProxy, port: e.target.value })} className="font-bold border-gray-200" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Username (Optional)</label>
                                            <Input placeholder="user123" value={newProxy.username} onChange={e => setNewProxy({ ...newProxy, username: e.target.value })} className="font-bold border-gray-200" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Password (Optional)</label>
                                            <Input type="password" placeholder="••••••••" value={newProxy.password} onChange={e => setNewProxy({ ...newProxy, password: e.target.value })} className="font-bold border-gray-200" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Proxy Type</label>
                                            <select className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white font-bold text-xs focus:ring-2 focus:ring-blue-500 transition-all" value={newProxy.type} onChange={e => setNewProxy({ ...newProxy, type: e.target.value })}>
                                                <option value="RESIDENTIAL">RESIDENTIAL (Rank Improvement Optimizer)</option>
                                                <option value="DATACENTER">DATACENTER (Standard Search Routing)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="ghost" className="font-bold text-gray-400 hover:text-gray-900" onClick={() => setShowAddProxy(false)}>Discard</Button>
                                        <Button onClick={handleAddProxy} className="bg-blue-600 text-white font-black uppercase text-xs tracking-widest px-8 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                            Add Coordinate Pair
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2 mb-4">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[3px]">Active Routing Pool</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase">Direct System Connection</span>
                                            <button
                                                onClick={() => {
                                                    const newValue = !useSystemProxy;
                                                    setUseSystemProxy(newValue);
                                                    persistSetting('useSystemProxy', String(newValue));
                                                }}
                                                className={`w-10 h-5 rounded-full relative transition-all ${useSystemProxy ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useSystemProxy ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>
                                        <Badge variant="outline" className="font-black text-[10px] border-emerald-500/20 text-emerald-600 bg-emerald-50">{proxies.length} ROUTE(S) READY</Badge>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Endpoint</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {useSystemProxy && (
                                                <tr className="bg-blue-50/30">
                                                    <td className="px-6 py-4">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-blue-600 uppercase tracking-tight text-xs flex items-center gap-2">
                                                            <Server size={14} />
                                                            System Default (Direct Tunnel)
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase text-blue-600 border-blue-200">System</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Primary Link</span>
                                                    </td>
                                                </tr>
                                            )}
                                            {proxies.length === 0 && !useSystemProxy ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-16 text-center">
                                                        <div className="opacity-10 mb-4 flex justify-center"><AlertCircle size={48} /></div>
                                                        <p className="text-gray-400 font-bold uppercase text-xs tracking-[2px]">Routing Pool Empty</p>
                                                        <p className="text-gray-300 text-[10px] mt-1 italic">Scraping will fail without a routing bridge.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                proxies.map(p => (
                                                    <tr key={p.id} className="hover:bg-gray-50/50 group transition-all">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleToggleProxy(p.id, p.enabled)}
                                                                    className={`w-2.5 h-2.5 rounded-full transition-all ${p.enabled ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-gray-300'}`}
                                                                />
                                                                <span className={`text-[9px] font-black uppercase tracking-tight ${p.status === 'DEAD' ? 'text-rose-500' : p.status === 'ACTIVE' ? 'text-emerald-500' : 'text-gray-400'}`}>
                                                                    {p.status || 'UNTESTED'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-mono font-bold text-gray-700 text-xs">{p.host}:{p.port}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-gray-200 text-gray-500">{p.type}</Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleDeleteProxy(p.id)}
                                                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeSection === 'providers' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { name: 'Bright Data', icon: Zap, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'hover:ring-blue-500/30' },
                                { name: 'Smartproxy', icon: Shield, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', border: 'hover:ring-indigo-500/30' },
                                { name: 'IPRoyal', icon: Globe, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'hover:ring-emerald-500/30' },
                                { name: 'Oxylabs', icon: Server, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'hover:ring-amber-500/30' },
                                { name: 'NetNut', icon: Activity, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', border: 'hover:ring-rose-500/30' },
                                { name: 'Proxy-Hub', icon: Shield, iconBg: 'bg-gray-100', iconColor: 'text-gray-900', border: 'hover:ring-gray-900/30' }
                            ].map((provider) => (
                                <Card key={provider.name} className={`p-8 border-none shadow-xl ring-1 ring-gray-200 bg-white transition-all group ${provider.border}`}>
                                    <div className={`w-14 h-14 rounded-2xl ${provider.iconBg} ${provider.iconColor} flex items-center justify-center mb-8 shadow-sm`}>
                                        <provider.icon size={28} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-3">{provider.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        Premium residential routing with over 72M+ ethically sourced IPs and city-level targeting.
                                    </p>
                                </Card>
                            ))}
                        </div>
                        <Card className="p-8 bg-blue-600 border-none shadow-xl text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Want to use a specific provider?</h3>
                            <p className="text-blue-100 font-medium mb-6">Learn how to integrate any residential or mobile proxy provider using our standard manual entry mode.</p>
                            <Link href="/help">
                                <Button className="bg-white text-blue-600 hover:bg-blue-50 font-black uppercase text-xs tracking-widest px-8">Read Integration Guide</Button>
                            </Link>
                        </Card>
                    </div>
                )}

                {activeSection === 'notifications' && (
                    <Card className="p-8 border-none shadow-xl ring-1 ring-gray-200 bg-white max-w-2xl animate-in fade-in duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Intelligence Alerts</h3>
                                <p className="text-sm text-gray-500 font-medium">Configure spatial milestone triggers</p>
                            </div>
                        </div>

                        <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${notificationsEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                <Bell size={32} className={notificationsEnabled ? '' : 'animate-bounce'} />
                            </div>
                            <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">
                                {notificationsEnabled ? 'System Alerts Enabled' : 'Enable Browser Notifications'}
                            </h4>
                            <p className="text-sm text-gray-500 font-medium mb-6 max-w-xs">
                                Receive real-time updates directly on your desktop when scans complete or rankings change.
                            </p>
                            <Button
                                onClick={handleEnableNotifications}
                                disabled={notificationsEnabled || checkingNotifications}
                                className={`h-12 px-8 font-black uppercase text-xs tracking-widest ${notificationsEnabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
                            >
                                {checkingNotifications ? <Loader2 size={16} className="animate-spin" /> : notificationsEnabled ? 'Notifications Ready' : 'Enable Desktop Alerts'}
                            </Button>
                        </div>

                        <div className={`space-y-4 transition-opacity ${notificationsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            {[
                                { title: 'Scan Precision Completed', desc: 'Trigger event when all grid points reach status: COMPLETED' },
                                { title: 'Target Displacement', desc: 'Alert when a target business drops more than 3 positions' },
                                { title: 'New Competitor Incursion', desc: 'Notify when an unknown GBP entity enters the Top 3' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-colors group">
                                    <div className="max-w-[80%]">
                                        <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{item.title}</p>
                                        <p className="text-xs text-gray-500 mt-1 font-medium">{item.desc}</p>
                                    </div>
                                    <button className={`w-11 h-6 rounded-full relative transition-all ${i === 0 ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${i === 0 ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
                {activeSection === 'logs' && (
                    <Telemetry />
                )}
            </main>

            <footer className="mt-20 py-8 border-t border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[6px] transition-all hover:text-blue-500 hover:tracking-[8px] cursor-default">
                    GMB Spatial Engine v3.0.1 • Precision Ranking Intelligence
                </p>
            </footer>
        </div>
    );
}
