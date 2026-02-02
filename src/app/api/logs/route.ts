import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const level = searchParams.get('level');
        const source = searchParams.get('source');

        const where: any = {};
        if (level) where.level = level;
        if (source) where.source = source;

        const logs = await (prisma as any).systemLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Logs API error:', error);
        return NextResponse.json({ logs: [] });
    }
}

export async function DELETE() {
    try {
        await (prisma as any).systemLog.deleteMany({});
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
