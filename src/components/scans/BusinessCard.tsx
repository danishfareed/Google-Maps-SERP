'use client';

import { useState } from 'react';
import {
    ExternalLink,
    MapPin,
    Tag,
    Compass,
    ChevronDown,
    ChevronUp,
    Phone,
    Globe,
    Copy,
    CheckCircle2,
    Clock,
    Star,
    Building2,
    Hash
} from 'lucide-react';

interface BusinessData {
    name: string;
    rank: number;
    rating?: number;
    reviews?: number;
    address?: string;
    url?: string;
    // Enhanced fields
    category?: string;
    isSAB?: boolean;
    priceLevel?: string;
    // Deep GBP fields
    cid?: string;
    placeId?: string;
    allCategories?: string[];
    phone?: string;
    website?: string;
    hours?: string;
    photosCount?: number;
    yearsInBusiness?: number;
    openNow?: boolean;
    profileCompleteness?: number;
    businessProfileId?: string;
}

interface BusinessCardProps {
    biz: BusinessData;
    scan: {
        businessName?: string;
    };
    compact?: boolean;
}

export function BusinessCard({ biz, scan, compact = false }: BusinessCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const isTarget = scan.businessName && biz.name.toLowerCase().includes(scan.businessName.toLowerCase());

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const generateReviewLink = (placeId: string) => {
        return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
    };

    return (
        <div
            className={`
                group bg-white rounded-xl ring-1 ring-gray-200 hover:ring-blue-500/50 hover:shadow-md transition-all relative overflow-hidden
                ${compact ? 'p-2.5' : 'p-4'}
                ${isTarget ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
            `}
        >
            {/* Main Card Content - Clickable */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="cursor-pointer"
            >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-1.5">
                    <span className={`
                        rounded-lg font-black flex items-center justify-center shrink-0
                        ${compact ? 'text-[9px] px-1.5 py-0.5 h-6 min-w-[1.5rem]' : 'w-7 h-7 text-xs'}
                        ${biz.rank <= 3 ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'bg-gray-100 text-gray-500'}
                    `}>
                        #{biz.rank}
                    </span>
                    <div className="flex items-center gap-1">
                        {biz.priceLevel && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                {biz.priceLevel}
                            </span>
                        )}
                        {biz.openNow && (
                            <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                OPEN
                            </span>
                        )}
                        {expanded ? (
                            <ChevronUp size={compact ? 12 : 14} className="text-gray-400" />
                        ) : (
                            <ChevronDown size={compact ? 12 : 14} className="text-gray-400" />
                        )}
                    </div>
                </div>

                {/* Business Name - Full display without truncation */}
                <p className={`
                    font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight uppercase
                    ${compact ? 'text-[11px] mb-1.5 min-h-[28px]' : 'text-sm mb-2'}
                `}>
                    {biz.name}
                </p>

                {/* Category Badge */}
                {biz.category && !compact && (
                    <div className="flex items-center gap-1 mb-2">
                        <Tag size={10} className="text-purple-500/70" />
                        <span className="text-[10px] text-purple-600 font-semibold">
                            {biz.category}
                        </span>
                    </div>
                )}

                {/* Ratings */}
                <div className={`flex items-center gap-1.5 ${compact ? 'mb-2' : 'mb-3'}`}>
                    <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded text-amber-600 border border-amber-100">
                        <span className="text-[10px] font-black">{biz.rating || '0.0'}</span>
                        <span className="text-[8px]">★</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">({biz.reviews || 0} reviews)</span>
                </div>

                {/* Address / SAB */}
                <div className={`flex items-start gap-2 border-t border-gray-50 ${compact ? 'pt-2' : 'pt-3 mt-auto'}`}>
                    {biz.isSAB ? (
                        <div className="flex items-center gap-2 w-full">
                            <div className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0">
                                SAB
                            </div>
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                <Compass size={10} className="text-amber-500/60 shrink-0" />
                                <span className="text-[10px] text-amber-600 font-medium truncate">
                                    {biz.address || 'Service Area Business'}
                                </span>
                            </div>
                        </div>
                    ) : biz.address ? (
                        <div className="flex items-start gap-1.5 w-full min-w-0">
                            <MapPin size={10} className="text-blue-500/60 shrink-0 mt-0.5" />
                            <span className="text-[10px] text-gray-600 font-medium break-words leading-tight">
                                {biz.address}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <MapPin size={10} className="text-gray-300 shrink-0" />
                            <span className="text-[10px] text-gray-400 italic">
                                No address available
                            </span>
                        </div>
                    )}
                </div>

                {/* Target Account Badge */}
                {isTarget && !compact && (
                    <div className="mt-3 bg-blue-600 text-[9px] font-black text-white py-1.5 px-3 rounded-xl uppercase tracking-[2px] text-center shadow-lg shadow-blue-500/30">
                        Target Account Linked
                    </div>
                )}
            </div>

            {/* Expanded Detail Panel */}
            {expanded && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Profile Completeness */}
                    {biz.profileCompleteness !== undefined && (
                        <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Profile Score</span>
                                <span className={`text-xs font-black ${biz.profileCompleteness >= 70 ? 'text-green-600' :
                                    biz.profileCompleteness >= 40 ? 'text-amber-600' : 'text-red-500'
                                    }`}>{biz.profileCompleteness}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${biz.profileCompleteness >= 70 ? 'bg-green-500' :
                                        biz.profileCompleteness >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${biz.profileCompleteness}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-2">
                        {biz.phone && (
                            <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg p-2">
                                <Phone size={12} className="text-gray-400" />
                                <span className="text-gray-700">{biz.phone}</span>
                            </div>
                        )}
                        {biz.website && (
                            <a
                                href={biz.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg p-2 hover:bg-blue-100 transition-colors"
                            >
                                <Globe size={12} className="text-blue-500" />
                                <span className="text-blue-600 truncate">Website</span>
                                <ExternalLink size={10} className="text-blue-400" />
                            </a>
                        )}
                    </div>

                    {/* Years in Business */}
                    {biz.yearsInBusiness && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock size={12} className="text-gray-400" />
                            <span>{biz.yearsInBusiness}+ years in business</span>
                        </div>
                    )}

                    {biz.allCategories && biz.allCategories.length > 0 && (
                        <div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 flex items-center justify-between">
                                <span>Categories</span>
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded-full">{biz.allCategories.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {biz.allCategories.map((cat, i) => (
                                    <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-medium">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Google IDs */}
                    <div className="flex flex-wrap gap-2">
                        {biz.cid && (
                            <button
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(biz.cid!, 'cid'); }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-[10px] font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                {copiedId === 'cid' ? (
                                    <CheckCircle2 size={10} className="text-green-500" />
                                ) : (
                                    <Copy size={10} />
                                )}
                                CID
                            </button>
                        )}
                        {biz.placeId && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(biz.placeId!, 'placeId'); }}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-[10px] font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                    {copiedId === 'placeId' ? (
                                        <CheckCircle2 size={10} className="text-green-500" />
                                    ) : (
                                        <Copy size={10} />
                                    )}
                                    Place ID
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(generateReviewLink(biz.placeId!), 'review'); }}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded text-[10px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                                >
                                    {copiedId === 'review' ? (
                                        <CheckCircle2 size={10} className="text-green-500" />
                                    ) : (
                                        <Star size={10} />
                                    )}
                                    Review Link
                                </button>
                            </>
                        )}
                        {biz.businessProfileId && (
                            <button
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(biz.businessProfileId!, 'bpid'); }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-[10px] font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                {copiedId === 'bpid' ? (
                                    <CheckCircle2 size={10} className="text-green-500" />
                                ) : (
                                    <Copy size={10} />
                                )}
                                Business Profile ID
                            </button>
                        )}
                    </div>

                    {/* Open in Maps Button */}
                    {biz.url && (
                        <a
                            href={biz.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <MapPin size={14} />
                            Open in Google Maps
                            <ExternalLink size={12} />
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
