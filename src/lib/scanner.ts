import { prisma } from './prisma';
import { generateGrid } from './grid';
import { scrapeGMB } from './scraper';

export async function runScan(scanId: string) {
    const scan = await prisma.scan.findUnique({
        where: { id: scanId },
    });

    if (!scan) throw new Error('Scan not found');

    await prisma.scan.update({
        where: { id: scanId },
        data: { status: 'RUNNING' },
    });

    const points = generateGrid(scan.centerLat, scan.centerLng, scan.radius, scan.gridSize);

    for (const point of points) {
        console.log(`Scraping point: ${point.lat}, ${point.lng}`);
        const results = await scrapeGMB(scan.keyword, point.lat, point.lng);

        await prisma.result.create({
            data: {
                scanId: scan.id,
                lat: point.lat,
                lng: point.lng,
                topResults: JSON.stringify(results),
                // Note: targetName rank logic can be added later
            },
        });

        // Delay between points to avoid detection
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    }

    await prisma.scan.update({
        where: { id: scanId },
        data: { status: 'COMPLETED' },
    });
}
