import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const businessName = searchParams.get('businessName');

    if (!keyword || !businessName) {
        return NextResponse.json({ error: 'keyword and businessName are required' }, { status: 400 });
    }

    try {
        // Fetch all completed scans for this keyword+business combo
        const scans = await prisma.scan.findMany({
            where: {
                keyword,
                businessName,
                status: 'COMPLETED'
            },
            orderBy: { createdAt: 'asc' },
            include: { results: true }
        });

        const history = scans.map(scan => {
            const rankedResults = scan.results.filter(r => r.rank !== null);
            const avgRank = rankedResults.length > 0
                ? rankedResults.reduce((acc, r) => acc + (r.rank || 0), 0) / rankedResults.length
                : 20;
            const top3Count = rankedResults.filter(r => r.rank && r.rank <= 3).length;

            return {
                date: scan.createdAt.toISOString(),
                avgRank: Math.round(avgRank * 10) / 10,
                top3Count,
                scanId: scan.id
            };
        });

        return NextResponse.json({ history });
    } catch (error) {
        console.error('History fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
