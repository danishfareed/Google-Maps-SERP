import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const scan = await (prisma as any).scan.findUnique({
            where: { id },
            include: { results: true },
        });

        if (!scan) {
            return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
        }

        return NextResponse.json({ scan });
    } catch (error) {
        console.error('Scan GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch scan' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.result.deleteMany({ where: { scanId: id } });
        await prisma.scan.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Scan DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete scan' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const scan = await prisma.scan.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(scan);
    } catch (error) {
        console.error('Scan PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update scan' }, { status: 500 });
    }
}
