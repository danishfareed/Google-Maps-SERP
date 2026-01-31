import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runScan } from '@/lib/scanner';

export async function POST(req: Request) {
    try {
        const { keyword, address, radius, gridSize } = await req.json();

        // In a real app, we'd geocode the address. 
        // For this POC, let's use a dummy center if not provided or just hardcode for testing.
        // Ideally use Google Maps Geocoding API or a free alternative.
        // LETS GOogle it or assume a fixed one for now or mock it.

        // MOCKING Geocoding Chicago center for now
        const centerLat = 41.8781;
        const centerLng = -87.6298;

        const scan = await prisma.scan.create({
            data: {
                keyword,
                centerLat,
                centerLng,
                radius: parseFloat(radius),
                gridSize: parseInt(gridSize),
                status: 'PENDING',
            },
        });

        // Run the scan in the background (fire and forget for now, or use a worker)
        runScan(scan.id).catch(console.error);

        return NextResponse.json(scan);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 });
    }
}
