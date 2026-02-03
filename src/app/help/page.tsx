'use client';

import { Card, Button } from '@/components/ui';
import {
    HelpCircle,
    Zap,
    Map as MapIcon,
    Navigation,
    ChevronRight,
    Play,
    Clock,
    Shield,
    BarChart3,
    CheckCircle,
    Star,
    Phone,
    Globe,
    MapPin,
    Tag,
    DollarSign,
    Building2,
    TrendingUp,
    Target,
    ArrowRight
} from 'lucide-react';

const sections = [
    {
        title: "Getting Started",
        icon: Play,
        content: "To start a new scan, click the 'New Report' button in the sidebar. You can choose between a 'Quick Scan' (to see who is ranking for a keyword) or 'Tracker' mode (to see where your specific business ranks)."
    },
    {
        title: "Advanced Grid Features",
        icon: MapIcon,
        content: "We support both Square and Circle grids. You can now also move pins manually on the preview map before starting a scan. Simply click and drag any pin to refine your target area."
    },
    {
        title: "Zip Code Intelligence",
        icon: Navigation,
        content: "Use the 'City Zip Scan' mode to automatically cluster pins around specific zip codes within a city. This is perfect for high-density metropolitan analysis."
    },
    {
        title: "Proxy Support",
        icon: Shield,
        content: "For heavy scanning, we recommend using Residential Proxies. You can configure these in the Settings. We support both free and paid proxy rotations to ensure your server IP stays clean."
    },
    {
        title: "Understanding Schedules",
        icon: Clock,
        content: "Since this app runs on your local machine, scheduled scans (e.g., every 24 hours) will only trigger when the application is running. If you miss a scan while offline, GeoRanker will prompt you to run it the next time you start the app."
    },
    {
        title: "Reports & Analysis",
        icon: BarChart3,
        content: "Every scan generates a deep analysis card. We calculate 'Market Dominance' and 'Share of Voice' based on where your business (or competitors) appear in the Top 3 and Top 10 results."
    },
    {
        title: "Provider Integration",
        icon: Zap,
        content: "To use a premium provider like Bright Data or Smartproxy, go to Settings > Proxies > Manual Entry. Copy your provider's endpoint host, port, and credentials. Ensure you select 'Residential' for the best results."
    }
];

const scoreBreakdown = [
    { label: 'Business Name', points: 15, icon: Building2, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    { label: 'Physical Address', points: 15, icon: MapPin, bgColor: 'bg-green-100', textColor: 'text-green-600' },
    { label: 'Star Rating', points: 10, icon: Star, bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
    { label: 'Review Count', points: 10, icon: CheckCircle, bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
    { label: 'Phone Number', points: 10, icon: Phone, bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
    { label: 'Website URL', points: 10, icon: Globe, bgColor: 'bg-cyan-100', textColor: 'text-cyan-600' },
    { label: 'Primary Category', points: 10, icon: Tag, bgColor: 'bg-pink-100', textColor: 'text-pink-600' },
    { label: 'Secondary Categories', points: 5, icon: Tag, bgColor: 'bg-rose-100', textColor: 'text-rose-600' },
    { label: 'Price Level', points: 5, icon: DollarSign, bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
    { label: 'Is Physical Location', points: 5, icon: Target, bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
    { label: 'Years in Business', points: 5, icon: Clock, bgColor: 'bg-slate-100', textColor: 'text-slate-600' },
];

const faqs = [
    {
        question: 'What is a Profile Completeness Score?',
        answer: 'The Profile Completeness Score measures how well-optimized a Google Business Profile is. A higher score indicates a more complete profile, which typically correlates with better local search visibility.'
    },
    {
        question: 'Why are some addresses not displaying?',
        answer: 'Google Maps uses complex, nested data structures that can change. We use multiple extraction methods to capture addresses, but some Service Area Businesses (SABs) intentionally hide their physical addresses. If an address is missing, it may be due to the business choosing not to display it publicly.'
    },
    {
        question: 'What is an SAB (Service Area Business)?',
        answer: 'A Service Area Business is a business that serves customers at their locations rather than at a physical storefront. Examples include plumbers, electricians, and mobile services. These businesses often hide their physical address on Google Maps.'
    },
    {
        question: 'How often should I run scans?',
        answer: 'For active SEO campaigns, weekly scans are recommended. Monthly scans are suitable for maintenance monitoring. Daily scans are useful during intensive optimization periods.'
    },
];

export default function HelpPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <HelpCircle size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Intelligence Guide</h1>
                    </div>
                    <p className="text-xs text-gray-500 font-bold ml-1 uppercase tracking-widest opacity-70">Comprehensive Spatial Documentation</p>
                </div>
            </header>

            {/* Profile Score Section */}
            <Card className="overflow-hidden border-none ring-1 ring-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp size={24} />
                        <h2 className="text-xl font-black">Profile Completeness Score</h2>
                    </div>
                    <p className="text-blue-100 text-sm">How we calculate the 0-100% profile score for each business.</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {scoreBreakdown.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                                        <item.icon size={16} className={item.textColor} />
                                    </div>
                                    <span className="font-bold text-gray-700 text-sm">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xl font-black text-gray-900">{item.points}</span>
                                    <span className="text-[10px] text-gray-400 font-bold">pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={16} className="text-blue-600" />
                            <span className="font-black text-blue-800 text-sm">Total: 100 Points</span>
                        </div>
                        <p className="text-xs text-blue-700">
                            A score of 70+ is considered <strong>excellent</strong>. Scores below 40 indicate significant profile optimization opportunities.
                        </p>
                    </div>
                </div>
            </Card>

            {/* FAQs */}
            <Card className="border-none ring-1 ring-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <HelpCircle size={20} className="text-purple-600" />
                        <h2 className="text-xl font-black text-gray-900">Frequently Asked Questions</h2>
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                                <ArrowRight size={14} className="text-blue-500" />
                                {faq.question}
                            </h3>
                            <p className="text-gray-600 leading-relaxed pl-5 text-sm">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section) => (
                    <Card key={section.title} className="h-full p-6 hover:shadow-lg transition-all border-none ring-1 ring-gray-100 group">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <section.icon size={20} />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="font-bold text-gray-900 flex items-center justify-between">
                                    {section.title}
                                    <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {section.content}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card noPadding className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-none shadow-xl shadow-blue-900/20 overflow-hidden relative">
                <div className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/30 rounded-lg backdrop-blur-md">
                                <Zap size={16} className="text-blue-300 fill-blue-300" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Pro Tip</span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Master the "Smart Grid" Logic</h2>
                        <p className="text-blue-100/100 text-sm leading-relaxed">
                            Our <strong className="text-blue-300 mt-1">Variable Density Engine</strong> prioritizes scan points based on proximity to the center.
                            This allows for ultra-high resolution results where rank fluctuation is most frequent, while covering peripheral zones efficiently.
                        </p>
                        <Button className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-6 border-none">
                            Explore Smart Grids
                        </Button>
                    </div>
                    <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-md">
                        <Navigation size={64} className="text-white opacity-20" />
                    </div>
                </div>
            </Card>
        </div>
    );
}

