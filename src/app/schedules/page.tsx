'use client';

import { Calendar, Clock, Plus, Bell } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import Link from 'next/link';

export default function SchedulesPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Calendar size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Scan Schedules</h1>
                    </div>
                    <p className="text-xs text-gray-500 font-bold ml-1 uppercase tracking-widest opacity-70">Automated Recurring Intelligence</p>
                </div>
                <Link href="/scans/new">
                    <Button className="h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-black uppercase text-xs tracking-widest">
                        <Plus className="mr-2 w-4 h-4" /> New Schedule
                    </Button>
                </Link>
            </header>

            <main className="space-y-8">

                <Card className="text-center py-24 border-none shadow-xl ring-1 ring-gray-200 bg-white">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-50 flex items-center justify-center ring-1 ring-gray-100">
                        <Calendar className="w-10 h-10 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">No Active Schedules</h2>
                    <p className="text-gray-400 max-w-md mx-auto mb-8 font-medium italic leading-relaxed">
                        Set up automated scans to track your rankings over time.
                        Create a new tracker with a Daily or Weekly frequency to get started.
                    </p>
                    <Link href="/scans/new">
                        <Button className="bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs tracking-widest px-8 h-12">Create Scheduled Tracker</Button>
                    </Link>
                </Card>
            </main>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Clock, title: 'Automated Tracking', desc: 'Run scans automatically at set intervals without manual intervention.', color: 'text-blue-500', bg: 'bg-blue-50' },
                    { icon: Bell, title: 'Rank Alerts', desc: 'Get notified when your rankings change significantly.', color: 'text-rose-500', bg: 'bg-rose-50', badge: 'Soon' },
                    { icon: Calendar, title: 'Historical Trends', desc: 'Compare your performance across different time periods.', color: 'text-emerald-500', bg: 'bg-emerald-50', badge: 'Soon' }
                ].map((feature, i) => (
                    <Card key={i} className="p-8 border-none shadow-lg ring-1 ring-gray-200 bg-white hover:ring-blue-500/30 transition-all">
                        <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6`}>
                            <feature.icon size={24} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                            {feature.desc}
                        </p>
                        {feature.badge && <Badge variant="blue" className="mt-4 font-black text-[9px] uppercase tracking-widest">{feature.badge}</Badge>}
                    </Card>
                ))}
            </div>
        </div>
    );
}
