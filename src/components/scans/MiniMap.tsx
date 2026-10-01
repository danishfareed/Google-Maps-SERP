'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Maximize2 } from 'lucide-react';
import { TILE_URL, TILE_MAX_ZOOM, assetUrl } from '@/lib/mapTiles';

interface MiniMapProps {
    lat: number;
    lng: number;
    rank?: number | null;
    onEnlarge: (lat: number, lng: number, rank: number | null | undefined) => void;
}

// Generate the numbered marker icon.
// Colours match the main map and its legend — keep the three in step.
const createNumberedMarker = (rank: number | null | undefined, size = 24) => {
    let bgColor = '#4b5563'; // gray — not found
    let label = '✕';

    if (rank !== null && rank !== undefined && rank >= 1) {
        label = String(rank);
        if (rank <= 3) {
            bgColor = '#22c55e'; // green — top 3
        } else if (rank <= 10) {
            bgColor = '#f59e0b'; // amber — 4-10
        } else {
            bgColor = '#ef4444'; // red — 11-20
        }
    }

    return L.divIcon({
        className: 'custom-rank-marker',
        html: `
            <div style="
                background-color: ${bgColor};
                color: #ffffff;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 900;
                font-size: ${size / 2}px;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                border: 2px solid white;
            ">
                ${label}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2], // Center anchor
    });
};

export function MiniMap({ lat, lng, rank, onEnlarge }: MiniMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    // One thumbnail renders per result row, so a 49-point scan would otherwise
    // mount 49 Leaflet instances and burst a few hundred tile requests on tab
    // open — more than OSM's tile usage policy allows from one client. Mount
    // each map only once its row is actually near the viewport.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        if (typeof IntersectionObserver === 'undefined') {
            setInView(true); // no observer support: just render
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // start loading just before it scrolls in
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm group bg-gray-100"
        >
            {inView && (
                <MapContainer
                    center={[lat, lng]}
                    zoom={14}
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                    keyboard={false}
                    attributionControl={false}
                    className="w-full h-full z-0"
                >
                    <TileLayer url={TILE_URL} maxZoom={TILE_MAX_ZOOM} />
                    <Marker position={[lat, lng]} icon={createNumberedMarker(rank, 24)} />
                </MapContainer>
            )}

            {/* Enlarge Overlay Button */}
            <div
                className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-[1000] backdrop-blur-[1px]"
                onClick={(e) => {
                    e.stopPropagation(); // prevent row expansion
                    onEnlarge(lat, lng, rank);
                }}
            >
                <div className="bg-white/90 p-1.5 rounded-full shadow-lg text-gray-800 hover:text-blue-600 transition-colors">
                    <Maximize2 size={16} />
                </div>
            </div>
        </div>
    );
}

// Leaflet's default marker images ship with the package — bundle them instead
// of pulling from a CDN, so the app works offline and needs no CDN origin in
// the Electron CSP.
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: assetUrl(markerIcon2x),
        iconUrl: assetUrl(markerIcon),
        shadowUrl: assetUrl(markerShadow),
    });
}
