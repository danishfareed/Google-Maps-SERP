export interface GridPoint {
    lat: number;
    lng: number;
    id?: string;
}

export type GridShape = 'SQUARE' | 'CIRCLE' | 'ZIP' | 'SMART';

export function generateGrid(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    gridSize: number,
    shape: GridShape = 'SQUARE'
): GridPoint[] {
    if (shape === 'CIRCLE') {
        return generateCircleGrid(centerLat, centerLng, radiusKm, gridSize);
    }

    if (shape === 'ZIP') {
        return generateZipGrid(centerLat, centerLng, radiusKm, gridSize);
    }

    if (shape === 'SMART') {
        return generateSmartGrid(centerLat, centerLng, radiusKm);
    }

    const points: GridPoint[] = [];
    const latDelta = radiusKm / 111.111;
    const lngDelta = radiusKm / (111.111 * Math.cos(centerLat * (Math.PI / 180)));

    const startLat = centerLat - latDelta;
    const startLng = centerLng - lngDelta;

    const latStep = gridSize > 1 ? (latDelta * 2) / (gridSize - 1) : 0;
    const lngStep = gridSize > 1 ? (lngDelta * 2) / (gridSize - 1) : 0;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            points.push({
                lat: startLat + i * latStep,
                lng: startLng + j * lngStep,
                id: `sq-${i}-${j}`
            });
        }
    }

    return points;
}

function generateCircleGrid(centerLat: number, centerLng: number, radiusKm: number, gridSize: number): GridPoint[] {
    const points: GridPoint[] = [];
    points.push({ lat: centerLat, lng: centerLng, id: 'center' }); // Always include center

    const rings = Math.floor(gridSize / 2);
    if (rings < 1) return points;

    for (let r = 1; r <= rings; r++) {
        const ringRadius = (radiusKm * r) / rings;
        const numPoints = r * 6; // Hexagonal-ish distribution

        for (let i = 0; i < numPoints; i++) {
            const angle = (i * 360) / numPoints;
            const bearing = angle * (Math.PI / 180);

            // Haversine-ish approximate offset
            const latOffset = (ringRadius / 111.111) * Math.cos(bearing);
            const lngOffset = (ringRadius / (111.111 * Math.cos(centerLat * (Math.PI / 180)))) * Math.sin(bearing);

            points.push({
                lat: centerLat + latOffset,
                lng: centerLng + lngOffset,
                id: `circle-${r}-${i}`
            });
        }
    }

    return points;
}

function generateZipGrid(centerLat: number, centerLng: number, radiusKm: number, gridSize: number): GridPoint[] {
    const points: GridPoint[] = [];
    // For Zip mode, we cluster pins semi-randomly but concentrated in sub-sectors
    // In a real app, this would query a zip-code boundary API
    const sectors = 4;
    const pointsPerSector = Math.ceil((gridSize * gridSize) / sectors);

    for (let s = 0; s < sectors; s++) {
        const sectorAngle = (s * 360) / sectors;
        const bearing = sectorAngle * (Math.PI / 180);

        // Sector center
        const sLat = centerLat + (radiusKm * 0.6 / 111.111) * Math.cos(bearing);
        const sLng = centerLng + (radiusKm * 0.6 / (111.111 * Math.cos(centerLat * (Math.PI / 180)))) * Math.sin(bearing);

        for (let i = 0; i < pointsPerSector; i++) {
            const jitter = 0.2 * radiusKm;
            const jLat = (Math.random() - 0.5) * jitter / 111.111;
            const jLng = (Math.random() - 0.5) * jitter / (111.111 * Math.cos(sLat * (Math.PI / 180)));

            points.push({
                lat: sLat + jLat,
                lng: sLng + jLng,
                id: `zip-${s}-${i}`
            });
        }
    }

    return points;
}

function generateSmartGrid(centerLat: number, centerLng: number, radiusKm: number): GridPoint[] {
    const points: GridPoint[] = [];
    const R = 6371; // Earth's radius in km

    // Smart grid focused on center
    points.push({ lat: centerLat, lng: centerLng, id: 'smart-center' });

    // Ring configuration: [distanceFromCenterInKm, pointSpacingInKm]
    // We scale this based on the total radius requested
    const ringConfigs = [
        { dist: 0.15, spacing: 0.3 },
        { dist: 0.4, spacing: 0.5 },
        { dist: 0.8, spacing: 0.8 },
        { dist: 1.5, spacing: 1.2 },
        { dist: 3.0, spacing: 2.0 },
        { dist: 6.0, spacing: 4.0 },
        { dist: 12.0, spacing: 8.0 }
    ];

    ringConfigs.forEach((ring, ringIdx) => {
        // Adjust ring distance relative to the requested radius
        // If radius is 3km, we don't want points at 12km
        if (ring.dist * (radiusKm / 3) > radiusKm && ringIdx > 1) return;

        const actualDist = ring.dist * (radiusKm / 3);
        const actualSpacing = ring.spacing * (radiusKm / 3);

        const circumference = 2 * Math.PI * actualDist;
        const numPoints = Math.max(3, Math.floor(circumference / actualSpacing));
        const angleStep = (2 * Math.PI) / numPoints;

        for (let i = 0; i < numPoints; i++) {
            const angle = angleStep * i;
            // Haversine approximation for small distances
            const latOffset = (actualDist / 111.111) * Math.cos(angle);
            const lngOffset = (actualDist / (111.111 * Math.cos(centerLat * (Math.PI / 180)))) * Math.sin(angle);

            points.push({
                lat: centerLat + latOffset,
                lng: centerLng + lngOffset,
                id: `smart-${ringIdx}-${i}`
            });
        }
    });

    return points;
}
