'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2 } from 'lucide-react';

interface MiniMapProps {
    lat: number;
    lng: number;
    rank?: number | null;
    onEnlarge: (lat: number, lng: number, rank: number | null | undefined) => void;
}

// Generate the numbered marker icon (same as the main map)
const createNumberedMarker = (rank: number | null | undefined, size = 24) => {
    let bgColor = '#94a3b8'; // gray
    let textColor = '#ffffff';
    let label = 'X'; // Default for unranked / quick scan

    if (rank) {
        label = rank.toString();
        if (rank <= 3) {
            bgColor = '#10b981'; // emerald-500
        } else if (rank <= 10) {
            bgColor = '#f59e0b'; // amber-500
        } else {
            bgColor = '#ef4444'; // red-500
        }
    }

    return L.divIcon({
        className: 'custom-rank-marker',
        html: `
            <div style="
                background-color: ${bgColor};
                color: ${textColor};
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
    return (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
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
                <TileLayer
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"                />
                <Marker position={[lat, lng]} icon={createNumberedMarker(rank, 24)} />
            </MapContainer>

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

// Ensure the CSS handles any leaflet default image issues
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}
