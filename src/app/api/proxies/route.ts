import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const proxies = await (prisma as any).proxy.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ proxies });
    } catch (error) {
        console.error('Proxies GET error:', error);
        return NextResponse.json({ proxies: [] });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();

        if (!data.host || !data.port) {
            return NextResponse.json({ error: 'Host and Port are required' }, { status: 400 });
        }

        const port = parseInt(data.port);
        if (isNaN(port)) {
            return NextResponse.json({ error: 'Invalid port number' }, { status: 400 });
        }

        // Check for duplicates
        const existing = await (prisma as any).proxy.findFirst({
            where: {
                host: data.host,
                port: port
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Proxy already exists in pool' }, { status: 409 });
        }

        const proxy = await (prisma as any).proxy.create({
            data: {
                host: data.host,
                port: port,
                username: data.username || null,
                password: data.password || null,
                type: data.type || 'RESIDENTIAL',
                enabled: data.enabled !== undefined ? data.enabled : true,
            },
        });
        return NextResponse.json(proxy);
    } catch (error: any) {
        console.error('Proxy creation error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return NextResponse.json({
            error: 'Failed to create proxy',
            details: error.message
        }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { id, ...data } = await req.json();
        const proxy = await (prisma as any).proxy.update({
            where: { id },
            data: {
                ...data,
                port: data.port ? parseInt(data.port) : undefined,
            },
        });
        return NextResponse.json(proxy);
    } catch (error) {
        console.error('Proxy update error:', error);
        return NextResponse.json({ error: 'Failed to update proxy' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id === 'all') {
            await (prisma as any).proxy.deleteMany({});
            return NextResponse.json({ success: true, message: 'Proxy pool purged' });
        }

        if (!id) throw new Error('Proxy ID required');

        await (prisma as any).proxy.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Proxy delete error:', error);
        return NextResponse.json({ error: 'Failed to delete proxy' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { action } = await req.json();
        const { validateProxyBatch } = await import('@/lib/proxy-tester');

        if (action === 'VALIDATE_ALL') {
            const proxies = await (prisma as any).proxy.findMany({
                where: { enabled: true }
            });

            console.log(`[ProxyAPI] Validating ${proxies.length} proxies...`);

            // Limit to top 100 for safety in single request
            const poolToTest = proxies.slice(0, 100);
            const results = await validateProxyBatch(poolToTest, 20);

            for (const res of results) {
                await (prisma as any).proxy.update({
                    where: { id: res.id },
                    data: {
                        status: res.success ? 'ACTIVE' : 'DEAD',
                        lastTestedAt: new Date()
                    }
                });
            }

            return NextResponse.json({
                success: true,
                tested: results.length,
                active: results.filter(r => r.success).length,
                dead: results.filter(r => !r.success).length
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Proxy PATCH error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
