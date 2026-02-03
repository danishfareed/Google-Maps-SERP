'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import {
    Wrench,
    Link2,
    Copy,
    CheckCircle2,
    ExternalLink,
    ArrowRightLeft,
    MapPin,
    Star,
    HelpCircle
} from 'lucide-react';
import { generateReviewLink, extractCidFromUrl, extractPlaceIdFromUrl, cidToMapsUrl } from '@/lib/analysis';

export default function ToolsPage() {
    const [reviewPlaceId, setReviewPlaceId] = useState('');
    const [reviewLink, setReviewLink] = useState('');
    const [reviewCopied, setReviewCopied] = useState(false);

    const [converterInput, setConverterInput] = useState('');
    const [extractedCid, setExtractedCid] = useState<string | null>(null);
    const [extractedPlaceId, setExtractedPlaceId] = useState<string | null>(null);
    const [converterCopied, setConverterCopied] = useState<string | null>(null);

    const handleGenerateReviewLink = () => {
        if (reviewPlaceId.trim()) {
            const link = generateReviewLink(reviewPlaceId.trim());
            setReviewLink(link);
        }
    };

    const handleExtractIds = () => {
        if (converterInput.trim()) {
            const cid = extractCidFromUrl(converterInput.trim());
            const placeId = extractPlaceIdFromUrl(converterInput.trim());
            setExtractedCid(cid);
            setExtractedPlaceId(placeId);
        }
    };

    const copyToClipboard = (text: string, type: 'review' | 'cid' | 'placeId') => {
        navigator.clipboard.writeText(text);
        if (type === 'review') {
            setReviewCopied(true);
            setTimeout(() => setReviewCopied(false), 2000);
        } else {
            setConverterCopied(type);
            setTimeout(() => setConverterCopied(null), 2000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                    <Wrench className="text-indigo-600" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Local SEO Power Tools</h1>
                    <p className="text-sm text-gray-500">Utilities for GBP management and analysis</p>
                </div>
            </div>

            {/* Review Link Generator */}
            <Card className="p-6 border border-gray-100">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Star className="text-amber-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Review Link Generator</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Generate a direct link for customers to leave a Google review for your business.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Place ID
                        </label>
                        <div className="flex gap-3">
                            <Input
                                placeholder="Enter Place ID (e.g., ChIJ...)"
                                value={reviewPlaceId}
                                onChange={(e) => setReviewPlaceId(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleGenerateReviewLink} disabled={!reviewPlaceId.trim()}>
                                <Link2 size={16} className="mr-2" />
                                Generate
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <HelpCircle size={12} />
                            Find Place ID from any scan result or use the ID Extractor below
                        </p>
                    </div>

                    {reviewLink && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                                    Your Review Link
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyToClipboard(reviewLink, 'review')}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-green-300 rounded-lg text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                                    >
                                        {reviewCopied ? (
                                            <><CheckCircle2 size={14} /> Copied!</>
                                        ) : (
                                            <><Copy size={14} /> Copy</>
                                        )}
                                    </button>
                                    <a
                                        href={reviewLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 rounded-lg text-xs font-medium text-white hover:bg-green-700 transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                        Test Link
                                    </a>
                                </div>
                            </div>
                            <code className="text-sm text-green-800 break-all block">{reviewLink}</code>
                        </div>
                    )}
                </div>
            </Card>

            {/* CID / Place ID Extractor */}
            <Card className="p-6 border border-gray-100">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">CID & Place ID Extractor</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Extract Google CID and Place ID from any Google Maps URL.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Google Maps URL
                        </label>
                        <div className="flex gap-3">
                            <Input
                                placeholder="Paste any Google Maps business URL..."
                                value={converterInput}
                                onChange={(e) => setConverterInput(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleExtractIds} disabled={!converterInput.trim()}>
                                <MapPin size={16} className="mr-2" />
                                Extract
                            </Button>
                        </div>
                    </div>

                    {(extractedCid || extractedPlaceId) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {extractedCid && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                            CID (Customer ID)
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(extractedCid, 'cid')}
                                            className="flex items-center gap-1 px-2 py-1 bg-white border border-indigo-300 rounded text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                                        >
                                            {converterCopied === 'cid' ? (
                                                <CheckCircle2 size={12} />
                                            ) : (
                                                <Copy size={12} />
                                            )}
                                        </button>
                                    </div>
                                    <code className="text-sm text-indigo-800 break-all block">{extractedCid}</code>
                                    <a
                                        href={cidToMapsUrl(extractedCid)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-2"
                                    >
                                        Open in Maps <ExternalLink size={10} />
                                    </a>
                                </div>
                            )}

                            {extractedPlaceId && (
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                                            Place ID
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(extractedPlaceId, 'placeId')}
                                            className="flex items-center gap-1 px-2 py-1 bg-white border border-purple-300 rounded text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                                        >
                                            {converterCopied === 'placeId' ? (
                                                <CheckCircle2 size={12} />
                                            ) : (
                                                <Copy size={12} />
                                            )}
                                        </button>
                                    </div>
                                    <code className="text-sm text-purple-800 break-all block">{extractedPlaceId}</code>
                                    <button
                                        onClick={() => {
                                            setReviewPlaceId(extractedPlaceId);
                                            handleGenerateReviewLink();
                                        }}
                                        className="text-xs text-purple-600 hover:underline flex items-center gap-1 mt-2"
                                    >
                                        Use for Review Link →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {converterInput && !extractedCid && !extractedPlaceId && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-sm text-amber-800">
                                Could not extract IDs from this URL. Make sure you're using a Google Maps business listing URL.
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 bg-gray-50 border-none">
                    <h3 className="font-bold text-gray-900 mb-2">What is a CID?</h3>
                    <p className="text-sm text-gray-600">
                        The CID (Customer ID) is a unique numeric identifier assigned by Google to every business listing.
                        It's useful for direct access to business profiles and API calls.
                    </p>
                </Card>
                <Card className="p-5 bg-gray-50 border-none">
                    <h3 className="font-bold text-gray-900 mb-2">What is a Place ID?</h3>
                    <p className="text-sm text-gray-600">
                        A Place ID is a textual identifier that uniquely identifies a place in Google's database.
                        It's used in Google APIs for reviews, place details, and directions.
                    </p>
                </Card>
            </div>
        </div>
    );
}
