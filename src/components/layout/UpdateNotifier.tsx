'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';

const GITHUB_PKG_URL = 'https://raw.githubusercontent.com/danishfareed/Google-Maps-SERP/main/package.json';
const CURRENT_VERSION = '1.2.0';

export function UpdateNotifier() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [latestVersion, setLatestVersion] = useState('');
    const [dismissed, setDismissed] = useState(false);
    const [showChanges, setShowChanges] = useState(false);
    const [releases, setReleases] = useState<any[]>([]);

    useEffect(() => {
        const checkUpdate = async () => {
            try {
                // Check GitHub for latest package version
                const res = await fetch(GITHUB_PKG_URL);
                if (!res.ok) return;
                const pkg = await res.json();

                if (pkg.version !== CURRENT_VERSION) {
                    setLatestVersion(pkg.version);
                    setUpdateAvailable(true);

                    // Also fetch release notes if they exist
                    const relRes = await fetch('/releases.json');
                    if (relRes.ok) {
                        setReleases(await relRes.json());
                    }
                }
            } catch (err) {
                console.error('Failed to check for updates:', err);
            }
        };

        checkUpdate();
    }, []);

    if (!updateAvailable || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full"
            >
                <div className="bg-white border-2 border-blue-600 rounded-2xl shadow-2xl p-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />

                    <button
                        onClick={() => setDismissed(true)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <Sparkles size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Update Available</h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Version {latestVersion} is out! You are on {CURRENT_VERSION}.</p>

                            <div className="flex items-center gap-3 mt-4">
                                <Button
                                    size="sm"
                                    className="h-8 px-4 bg-blue-600 text-[10px] font-black uppercase tracking-widest"
                                    onClick={() => window.open('https://github.com/danishfareed/Google-Maps-SERP', '_blank')}
                                >
                                    Get Update <ArrowRight size={12} className="ml-1" />
                                </Button>
                                <button
                                    onClick={() => setShowChanges(!showChanges)}
                                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                                >
                                    {showChanges ? 'Close' : 'View Changes'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showChanges && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t border-gray-100 overflow-hidden"
                            >
                                <div className="space-y-3">
                                    {releases.filter(r => r.version === latestVersion).map((rel, i) => (
                                        <div key={i}>
                                            <p className="text-[10px] font-black text-blue-600 uppercase mb-2 flex items-center gap-1">
                                                <Info size={10} /> {rel.title}
                                            </p>
                                            <ul className="space-y-1.5">
                                                {rel.changes.map((change: string, idx: number) => (
                                                    <li key={idx} className="text-[10px] text-gray-600 flex items-start">
                                                        <span className="mr-2 text-blue-400">•</span>
                                                        {change}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                    {releases.filter(r => r.version === latestVersion).length === 0 && (
                                        <p className="text-[10px] text-gray-400 italic">Check GitHub for release notes.</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
