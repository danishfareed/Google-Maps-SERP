'use client';

import { useEffect, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup,
    useMap,
    ZoomControl,
    useMapEvents,
    Circle,
    Marker
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
    let color = '#9ca3af'; // gray-400 (not found)
    let fillColor = '#d1d5db'; // gray-300
    let radius = 14;

    if (point.rank !== null) {
        if (point.rank <= 3) {
            color = '#15803d'; // green-700
            fillColor = '#22c55e'; // green-500
            radius = 18;
        } else if (point.rank <= 10) {
            color = '#b45309'; // amber-700
            fillColor = '#f59e0b'; // amber-500
            radius = 16;
        } else {
            color = '#b91c1c'; // red-700
            fillColor = '#ef4444'; // red-500
        }
    } else if (point.hasData) {
        color = '#2563eb'; // blue-600
        fillColor = '#60a5fa'; // blue-400
        radius = 16;
    }

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

    return (
        <CircleMarker
            center={[point.lat, point.lng]}
            radius={radius}
            eventHandlers={{
                click: () => onClick?.(point),
            }}
            pathOptions={{
                color: color,
                weight: 2,
                fillColor: fillColor,
                fillOpacity: 1,
            }}
        >
            {!onClick && (
                <Popup className="font-sans">
                    <div className="text-center p-1">
                        <div className="font-bold text-lg mb-1 text-gray-900">
                            #{point.rank ?? '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                            Lat: {point.lat.toFixed(4)}<br />
                            Lng: {point.lng.toFixed(4)}
                        </div>
                    </div>
                </Popup>
            )}
        </CircleMarker>
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
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
                        <div className="w-3 h-3 rounded-full bg-green-500 border border-green-700"></div>
                        <span className="text-gray-700">1 - 3</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-700"></div>
                        <span className="text-gray-700">4 - 10</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 border border-red-700"></div>
                        <span className="text-gray-700">11+</span>
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

