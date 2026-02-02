'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Settings,
    Plus,
    TrendingUp,
    MapPin,
    BarChart3,
    Calendar,
    ChevronRight,
    PanelLeftClose,
    HelpCircle,
    Activity
} from 'lucide-react';

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/scans', icon: MapPin, label: 'Rank Tracker' },
    { href: '/schedules', icon: Calendar, label: 'Schedules', disabled: false },
    { href: '/reports', icon: BarChart3, label: 'Reports', disabled: false },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);
    const [userName, setUserName] = useState('Local User');
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    useEffect(() => {
        const savedName = localStorage.getItem('gmbserp_user_name');
        if (savedName) setUserName(savedName);

        const savedCollapsed = localStorage.getItem('sidebar_collapsed');
        if (savedCollapsed !== null) setCollapsed(JSON.parse(savedCollapsed));
    }, []);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: newState } }));
    };

    return (
        <aside
            className={`
                sidebar-bg fixed top-0 left-0 h-screen flex flex-col z-50 transition-all duration-300 ease-in-out
                ${collapsed ? 'w-20' : 'w-64'}
            `}
        >
            {/* Logo Area */}
            <div className={`p-6 border-b border-gray-100 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-200 shrink-0">
                        <TrendingUp size={18} />
                    </div>
                    {!collapsed && (
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">
                            GeoRanker
                        </h1>
                    )}
                </Link>
                {!collapsed && (
                    <button onClick={toggleCollapse} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400">
                        <PanelLeftClose size={16} />
                    </button>
                )}
                {collapsed && (
                    <button onClick={toggleCollapse} className="absolute -right-3 top-7 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-sm hover:text-blue-600 z-50">
                        <ChevronRight size={14} />
                    </button>
                )}
            </div>

            {/* Primary Navigation */}
            <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} py-6 space-y-1`}>
                <div className="mb-6 relative group"
                    onMouseEnter={() => setHoveredItem('New Report')}
                    onMouseLeave={() => setHoveredItem(null)}>
                    <Link href="/scans/new">
                        <button
                            className={`
                                w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm shadow-blue-100 transition-all
                                ${collapsed ? 'px-0' : 'px-4'}
                            `}
                        >
                            <Plus className="w-4 h-4 shrink-0" />
                            {!collapsed && <span className="text-sm whitespace-nowrap">New Report</span>}
                        </button>
                    </Link>
                    {collapsed && hoveredItem === 'New Report' && (
                        <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap z-[100]">
                            New Report
                        </div>
                    )}
                </div>

                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <div key={item.label} className="relative"
                            onMouseEnter={() => setHoveredItem(item.label)}
                            onMouseLeave={() => setHoveredItem(null)}>
                            <Link href={item.disabled ? '#' : item.href}>
                                <div
                                    className={`
                                        flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium
                                        ${collapsed ? 'justify-center px-0' : 'px-3'}
                                        ${isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                    {!collapsed && <span>{item.label}</span>}
                                    {!collapsed && item.disabled && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-auto">SOON</span>
                                    )}
                                </div>
                            </Link>
                            {collapsed && hoveredItem === item.label && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap z-[100]">
                                    {item.label}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className={`p-4 border-t border-gray-100 bg-gray-50/50 ${collapsed ? 'flex flex-col items-center gap-4' : ''}`}>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} w-full mb-3`}>
                    {!collapsed && <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Support</p>}
                    <Link href="/help"
                        onMouseEnter={() => setHoveredItem('Help & Docs')}
                        onMouseLeave={() => setHoveredItem(null)}
                        className="relative">
                        <div className={`p-2 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 hover:text-blue-600 transition-all ${collapsed ? '' : '-mr-2'}`}>
                            <HelpCircle size={20} />
                        </div>
                        {collapsed && hoveredItem === 'Help & Docs' && (
                            <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap z-[100]">
                                Help & Docs
                            </div>
                        )}
                    </Link>
                </div>

                <div className="flex items-center gap-3 w-full border-t border-gray-200 pt-4">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200 shrink-0 uppercase">
                        {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Online
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
