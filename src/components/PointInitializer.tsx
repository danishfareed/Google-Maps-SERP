import { useEffect } from 'react';
import { generateGrid, GridShape } from '@/lib/grid';

interface FormData {
    centerLat: number;
    centerLng: number;
    radius: number;
    gridSize: number;
    shape: GridShape;
}

interface PointInitializerProps {
    formData: FormData;
    onPointsGenerated: (points: any[]) => void;
    customPoints: any[] | null;
}

export default function PointInitializer({ formData, onPointsGenerated, customPoints }: PointInitializerProps) {
    useEffect(() => {
        // Only auto-generate for geometric shapes. 
        // SMART grid points are fetched from the API via handleCityFetch.
        if (formData.shape === 'SMART') return;

        // If points are already present, do nothing (preserves dragged points)
        // Only generate if explicitly cleared (null)
        if (customPoints === null) {
            const points = generateGrid(
                formData.centerLat,
                formData.centerLng,
                formData.radius,
                formData.gridSize,
                formData.shape
            );
            onPointsGenerated(points);
        }
    }, [
        customPoints,
        formData.centerLat,
        formData.centerLng,
        formData.radius,
        formData.gridSize,
        formData.shape
    ]);

    return null; // Headless component
}
