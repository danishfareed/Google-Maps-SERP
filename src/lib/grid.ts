export interface GridPoint {
    lat: number;
    lng: number;
}

export function generateGrid(centerLat: number, centerLng: number, radiusKm: number, gridSize: number): GridPoint[] {
    const points: GridPoint[] = [];

    // 1 degree of latitude is ~111.111 km
    const latDelta = radiusKm / 111.111;
    // 1 degree of longitude is ~111.111 * cos(lat) km
    const lngDelta = radiusKm / (111.111 * Math.cos(centerLat * (Math.PI / 180)));

    const startLat = centerLat - latDelta;
    const startLng = centerLng - lngDelta;

    const latStep = (latDelta * 2) / (gridSize - 1);
    const lngStep = (lngDelta * 2) / (gridSize - 1);

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            points.push({
                lat: startLat + i * latStep,
                lng: startLng + j * lngStep,
            });
        }
    }

    return points;
}
