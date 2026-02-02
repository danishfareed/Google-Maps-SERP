import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { runScan } from '@/lib/scanner';
import { logger } from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await logger.info(`Rerun requested for scan ${id}`, 'API', { scanId: id });

        // Verify scan exists
        const scan = await (prisma as any).scan.findUnique({
            where: { id },
        });

        if (!scan) {
            await logger.warn(`Rerun failed: Scan ${id} not found`, 'API');
            return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
        }

        // 1. Clear existing results
        const deletedResults = await (prisma as any).result.deleteMany({
            where: { scanId: id }
        });

        // 2. Clear existing alerts for this scan
        await (prisma as any).alert.deleteMany({
            where: { scanId: id }
        });

        // 3. Reset scan status and nextRun
        const updatedScan = await (prisma as any).scan.update({
            where: { id },
            data: {
                status: 'PENDING',
                nextRun: null, // Clear next run so it doesn't conflict
            },
            include: {
                results: true
            }
        });

        await logger.info(`Scan ${id} reset. Deleted ${deletedResults.count} results. Triggering scan...`, 'API');

        // 4. Trigger in background
        runScan(id).catch(err => {
            logger.error(`[Rerun] Critical background failure for scan ${id}: ${err.message}`, 'API', { scanId: id, stack: err.stack });
        });

        return NextResponse.json({ success: true, scan: updatedScan });
    } catch (error: any) {
        await logger.error(`Scan Rerun handler crashed for ${id}: ${error.message}`, 'API', { stack: error.stack });
        console.error('Scan Rerun error:', error);
        return NextResponse.json({ error: 'Failed to rerun scan', details: error.message }, { status: 500 });
    }
}
