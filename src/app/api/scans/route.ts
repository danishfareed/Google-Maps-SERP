import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { runScan } from '@/lib/scanner';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        const scans = await prisma.scan.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ scans });
    } catch (error) {
        console.error('Scans GET error:', error);
        return NextResponse.json({ scans: [] });
    }
}

export async function POST(req: Request) {
    try {
        const {
            keyword,
            radius,
            gridSize,
            frequency,
            businessName,
            shape,
            customPoints,
            lat,
            lng
        } = await req.json();

        // Use provided coordinates or default to Chicago (Mock)
        const centerLat = typeof lat === 'number' ? lat : 41.8781;
        const centerLng = typeof lng === 'number' ? lng : -87.6298;

        const scan = await (prisma as any).scan.create({
            data: {
                keyword,
                centerLat,
                centerLng,
                radius: parseFloat(radius) || 5,
                gridSize: parseInt(gridSize) || 3,
                shape: shape || 'SQUARE',
                customPoints: customPoints ? JSON.stringify(customPoints) : null,
                frequency: frequency || 'ONCE',
                businessName: businessName || undefined,
                status: 'PENDING',
            },
        });

        // Start scan in background
        logger.info(`New scan created: "${keyword}"`, 'API', { scanId: scan.id });
        runScan(scan.id).catch(err => {
            logger.error(`Background scan handler crashed for ${scan.id}: ${err.message}`, 'API', { scanId: scan.id, stack: err.stack });
        });

        return NextResponse.json(scan);
    } catch (error) {
        console.error('Scan creation CRITICAL error:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json({ error: 'Failed to create scan', details: String(error) }, { status: 500 });
    }
}
