'use client';

import { useEffect, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    Popup,
    useMap,
    ZoomControl,
    useMapEvents,
    Circle,
    Marker
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { TILE_URL, TILE_ATTRIBUTION, TILE_MAX_ZOOM, assetUrl } from '@/lib/mapTiles';

// Default marker images ship with the leaflet package; bundling them keeps the
// app working offline and needs no CDN origin in the Electron CSP.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: assetUrl(markerIcon2x),
    iconUrl: assetUrl(markerIcon),
    shadowUrl: assetUrl(markerShadow),
});

interface Point {
    lat: number;
    lng: number;
    rank: number | null;
    hasData?: boolean;
    id?: string;
    draggable?: boolean;
}

interface MapProps {
    center: [number, number];
    zoom: number;
    points?: Point[];
    onCenterChange?: (lat: number, lng: number) => void;
    selectionMode?: boolean;
    radius?: number; // In KM
    gridSize?: number;
    onPointClick?: (point: Point) => void;
    onPointMove?: (pointId: string, lat: number, lng: number) => void;
    onGridMove?: (lat: number, lng: number) => void;
    showHeatmap?: boolean;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

function SelectionHandler({ onCenterChange }: { onCenterChange?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onCenterChange?.(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

const RankMarker = ({
    point,
    onClick,
    onMove
}: {
    point: Point;
    onClick?: (point: Point) => void;
    onMove?: (pointId: string, lat: number, lng: number) => void;
}) => {
    const map = useMap();

    if (point.draggable && onMove && point.id) {
        return (
            <Marker
                position={[point.lat, point.lng]}
                draggable={true}
                eventHandlers={{
                    dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        onMove(point.id!, position.lat, position.lng);
                    },
                }}
            />
        );
    }

    // Determine color and label based on rank
    let bgColor: string;
    let borderColor: string;
    let textColor: string;
    let label: string;

    if (point.rank !== null && point.rank >= 1) {
        label = String(point.rank);
        if (point.rank <= 3) {
            // Top 3 — Green
            bgColor = '#22c55e';
            borderColor = '#15803d';
            textColor = '#ffffff';
        } else if (point.rank <= 10) {
            // 4-10 — Orange/Amber  
            bgColor = '#f59e0b';
            borderColor = '#b45309';
            textColor = '#ffffff';
        } else {
            // 11-20 — Red
            bgColor = '#ef4444';
            borderColor = '#b91c1c';
            textColor = '#ffffff';
        }
    } else {
        // Not found — Dark with X
        label = '✕';
        bgColor = '#4b5563';
        borderColor = '#1f2937';
        textColor = '#ffffff';
    }

    const size = 30;
    const fontSize = label.length > 1 ? 11 : 13;

    const icon = L.divIcon({
        className: '',  // Remove default leaflet styles
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
        html: `<div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${bgColor};
            border: 2.5px solid ${borderColor};
            color: ${textColor};
            font-size: ${fontSize}px;
            font-weight: 700;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            cursor: pointer;
            user-select: none;
            line-height: 1;
        ">${label}</div>`,
    });

    return (
        <Marker
            position={[point.lat, point.lng]}
            icon={icon}
            bubblingMouseEvents={false}
            eventHandlers={{
                click: (e) => {
                    // Freeze the map — save current view
                    const center = map.getCenter();
                    const zoom = map.getZoom();

                    // Stop any in-progress animations
                    L.DomEvent.stopPropagation(e.originalEvent);
                    L.DomEvent.preventDefault(e.originalEvent);

                    // Fire the callback
                    onClick?.(point);

                    // Immediately restore the map position (undo any auto-pan)
                    requestAnimationFrame(() => {
                        map.setView(center, zoom, { animate: false });
                    });
                },
            }}
            keyboard={false}
        >
            {!onClick && (
                <Popup className="font-sans" autoPan={false}>
                    <div className="text-center p-1">
                        <div className="font-bold text-lg mb-1 text-gray-900">
                            {point.rank !== null ? `#${point.rank}` : 'Not Found'}
                        </div>
                        <div className="text-xs text-gray-500">
                            Lat: {point.lat.toFixed(4)}<br />
                            Lng: {point.lng.toFixed(4)}
                        </div>
                    </div>
                </Popup>
            )}
        </Marker>
    );
};

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        // Delay slightly to allow modal animations to finish
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

export default function LeafletMap({
    center,
    zoom,
    points = [],
    onCenterChange,
    selectionMode = false,
    radius = 5,
    gridSize = 3,
    onPointClick,
    onPointMove,
    onGridMove,
    showHeatmap = false
}: MapProps) {
    return (
        <div className="h-full w-full relative z-0 bg-gray-100">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', filter: 'contrast(1.05) saturate(1.1)' }}
                scrollWheelZoom={true}
                zoomControl={false}
            >
                <ZoomControl position="bottomright" />
                <MapResizer />

                <TileLayer
                    attribution={TILE_ATTRIBUTION}
                    url={TILE_URL}
                    maxZoom={TILE_MAX_ZOOM}
                />
                <MapUpdater center={center} zoom={zoom} />

                {selectionMode && <SelectionHandler onCenterChange={onCenterChange} />}

                {/* Selection Mode Visuals: Circle and Grid Preview */}
                {(selectionMode || onGridMove) && (
                    <>
                        <Circle
                            center={center}
                            radius={radius * 1000}
                            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }}
                        />
                        <Marker
                            position={center}
                            draggable={Boolean(onGridMove)}
                            eventHandlers={{
                                dragend: (e) => {
                                    const marker = e.target;
                                    const position = marker.getLatLng();
                                    onGridMove?.(position.lat, position.lng);
                                    onCenterChange?.(position.lat, position.lng);
                                },
                            }}
                        />
                    </>
                )}

                {/* Heatmap Layer - Large gradient circles for ranking density */}
                {showHeatmap && points.map((point, i) => {
                    let heatColor = 'rgba(156, 163, 175, 0.3)'; // gray for unranked
                    if (point.rank !== null) {
                        if (point.rank <= 3) {
                            heatColor = 'rgba(34, 197, 94, 0.35)'; // green
                        } else if (point.rank <= 10) {
                            heatColor = 'rgba(245, 158, 11, 0.35)'; // amber
                        } else {
                            heatColor = 'rgba(239, 68, 68, 0.35)'; // red
                        }
                    }
                    return (
                        <Circle
                            key={`heat-${point.id || i}`}
                            center={[point.lat, point.lng]}
                            radius={800} // 800 meters
                            pathOptions={{
                                color: 'transparent',
                                fillColor: heatColor,
                                fillOpacity: 1,
                            }}
                        />
                    );
                })}

                {/* Ranking Points */}
                {points.map((point, i) => (
                    <RankMarker
                        key={point.id || i}
                        point={point}
                        onClick={onPointClick}
                        onMove={onPointMove}
                    />
                ))}
            </MapContainer>

            {/* Floating Legend - Only in results mode */}
            {!selectionMode && points.length > 0 && (
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur border border-gray-200 p-3 rounded-lg shadow-lg z-[1000] text-xs font-medium space-y-2">
                    <div className="font-bold text-gray-900 mb-1 border-b border-gray-100 pb-1">Rank Legend</div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-700 flex items-center justify-center text-[9px] font-bold text-white">1</div>
                        <span className="text-gray-700">Top 3</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-amber-700 flex items-center justify-center text-[9px] font-bold text-white">5</div>
                        <span className="text-gray-700">4 - 10</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-700 flex items-center justify-center text-[9px] font-bold text-white">15</div>
                        <span className="text-gray-700">11 - 20</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-[9px] font-bold text-white">✕</div>
                        <span className="text-gray-700">Not Found</span>
                    </div>
                </div>
            )}

            {selectionMode && (
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur border border-gray-200 p-3 rounded-lg shadow-lg z-[1000] text-xs font-medium">
                    <p className="text-blue-600 font-bold">Interactive Mode</p>
                    <p className="text-gray-500 mt-1">Click map to set center location.</p>
                    <p className="text-gray-400 text-[10px] mt-1">Drag center marker to move grid.</p>
                </div>
            )}
        </div>
    );
}

