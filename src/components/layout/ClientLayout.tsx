'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { PageTransition } from './PageTransition';
import { UpdateNotifier } from './UpdateNotifier';

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        if (saved !== null) setCollapsed(JSON.parse(saved));

        // Listen for storage changes to sync across tabs if needed
        const handleStorage = () => {
            const current = localStorage.getItem('sidebar_collapsed');
            if (current !== null) setCollapsed(JSON.parse(current));
        };
        window.addEventListener('storage', handleStorage);

        // We also need a custom event for the same tab
        const handleCollapseChange = (e: any) => {
            setCollapsed(e.detail.collapsed);
        };
        window.addEventListener('sidebar-toggle', handleCollapseChange);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('sidebar-toggle', handleCollapseChange);
        };
    }, []);

    return (
        <div className="flex">
            <Sidebar />
            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-64'} min-h-screen p-8`}>
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
            <UpdateNotifier />
        </div>
    );
}
