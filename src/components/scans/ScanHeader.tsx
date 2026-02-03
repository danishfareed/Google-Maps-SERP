import { Badge, Button } from '@/components/ui';
import { Download, Share2, StopCircle, Trash2, MapPin, Calendar, ChevronLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ScanHeaderProps {
    scan: any;
    onStop: () => void;
    onRerun: () => void;
    onDelete: () => void;
    onExportXLSX: () => void;
    onExportPDF: () => void;
    onShare: () => void;
}

export function ScanHeader({ scan, onStop, onRerun, onDelete, onExportXLSX, onExportPDF, onShare }: ScanHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/scans" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronLeft size={16} className="text-gray-600" />
                </Link>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <MapPin size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-1">
                                {scan.keyword}
                            </h1>
                            {scan.businessName && (
                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest opacity-80">
                                    Tracking: {scan.businessName}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={scan.status === 'COMPLETED' ? 'success' : 'blue'} className="font-bold text-[10px] uppercase">{scan.status}</Badge>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-500" /> {scan.centerLat.toFixed(4)}, {scan.centerLng.toFixed(4)}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> {new Date(scan.createdAt).toDateString()}</span>
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onRerun} className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 font-bold">
                    <RefreshCw size={14} className="mr-2" /> Rerun
                </Button>
                {(scan.status === 'RUNNING' || scan.status === 'PENDING') && (
                    <Button variant="destructive" size="sm" onClick={onStop}>
                        <StopCircle size={14} className="mr-2" /> Stop Scan
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200">
                    <Trash2 size={14} className="mr-2" /> Delete
                </Button>
                <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={onExportXLSX}>
                        <Download size={14} className="mr-2" /> XLSX
                    </Button>
                    <Button variant="outline" size="sm" onClick={onExportPDF}>
                        <Download size={14} className="mr-2" /> PDF
                    </Button>
                </div>
                <Button variant="outline" size="sm" onClick={onShare}><Share2 size={14} className="mr-2" /> Share</Button>
            </div>
        </div>
    );
}
