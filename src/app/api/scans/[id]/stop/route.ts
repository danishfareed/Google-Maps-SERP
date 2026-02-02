import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await logger.info(`Stop requested for scan ${id}`, 'API', { scanId: id });

        const scan = await (prisma as any).scan.update({
            where: { id },
            data: { status: 'STOPPED' },
            include: { results: true }
        });

        await logger.info(`Scan ${id} manually stopped.`, 'API');

        return NextResponse.json({ success: true, scan });
    } catch (error: any) {
        await logger.error(`Scan Stop handler crashed for ${id}: ${error.message}`, 'API');
        return NextResponse.json({ error: 'Failed to stop scan', details: error.message }, { status: 500 });
    }
}
