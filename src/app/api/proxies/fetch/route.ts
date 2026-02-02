import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    console.log('[ProxyFetch] POST request received at /api/proxies/fetch');
    try {
        const sources = [
            { name: 'TheSpeedX', url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt' },
            { name: 'ShiftyTR', url: 'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt' },
            { name: 'Monosans', url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt' },
            { name: 'ProxyListPlus', url: 'https://raw.githubusercontent.com/mmpx12/proxy-list/master/http.txt' },
        ];

        // Safety Check: Check for active scans
        const activeScans = await prisma.scan.findFirst({
            where: { status: 'RUNNING' }
        });

        if (activeScans) {
            return NextResponse.json({
                success: false,
                logs: ['[CAUTION] Active scan detected.', '[ABORT] Proxy pool synchronization paused to prevent routing instability.'],
                count: 0
            });
        }

        let allProxies: string[] = [];
        const logs: string[] = [];

        for (const source of sources) {
            try {
                console.log(`[ProxyFetch] Fetching from ${source.name}: ${source.url}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout per source

                const res = await fetch(source.url, {
                    next: { revalidate: 3600 },
                    signal: controller.signal
                }).finally(() => clearTimeout(timeoutId));

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const text = await res.text();
                const lines = text.split('\n')
                    .map(l => l.trim())
                    .filter(l => l.includes(':') && l.length > 5);

                allProxies = [...allProxies, ...lines];
                console.log(`[ProxyFetch] ${source.name}: Got ${lines.length} proxies`);
                logs.push(`Fetched ${lines.length} proxies from ${source.name}`);
            } catch (err: any) {
                console.error(`[ProxyFetch] Failed ${source.name}:`, err.message);
                logs.push(`Failed to fetch from ${source.name}: ${err.message}`);
            }
        }

        console.log(`[ProxyFetch] Total unique potential proxies: ${new Set(allProxies).size}`);
        const uniqueEntries = Array.from(new Set(allProxies)).slice(0, 500);

        const proxyData = uniqueEntries.map(entry => {
            const [host, portStr] = entry.split(':');
            return {
                host,
                port: parseInt(portStr),
                type: 'DATACENTER' as const,
                enabled: true
            };
        }).filter(p => p.host && !isNaN(p.port));

        console.log(`[ProxyFetch] Performing quality check on 100 discovered routing pairs...`);
        logs.push('Evaluating routing quality for 100 candidates...');

        const { validateProxyBatch } = await import('@/lib/proxy-tester');
        const testPool = proxyData.slice(0, 100);
        const testResults = await validateProxyBatch(testPool, 20);

        // Map all proxies to their final state
        const processedProxies = proxyData.map(p => {
            const testResult = testResults.find(r => r.host === p.host && r.port === p.port);

            if (testResult) {
                return {
                    ...p,
                    status: testResult.success ? 'ACTIVE' as const : 'DEAD' as const,
                    lastTestedAt: new Date()
                };
            }

            return {
                ...p,
                status: 'UNTESTED' as const
            };
        });

        const activeCount = processedProxies.filter(p => p.status === 'ACTIVE').length;
        console.log(`[ProxyFetch] Quality Check: ${activeCount}/${testPool.length} verified routes.`);
        logs.push(`Quality Filter: Found ${activeCount} verified and ${proxyData.length - testPool.length} potential routes.`);

        console.log(`[ProxyFetch] Saving ${processedProxies.length} proxies to pool...`);

        // SQLite doesn't support skipDuplicates in createMany. 
        // We filter out existing proxies manually to avoid unique constraint violations.
        const existingProxies = await (prisma as any).proxy.findMany({
            select: { host: true, port: true }
        });

        const existingKeys = new Set(existingProxies.map((p: any) => `${p.host}:${p.port}`));
        const newProxies = processedProxies.filter(p => !existingKeys.has(`${p.host}:${p.port}`));

        console.log(`[ProxyFetch] Pool has ${existingProxies.length} existing. Detected ${newProxies.length} new unique from ${processedProxies.length} candidates.`);
        logs.push(`Deduplication: ${existingKeys.size} already in pool, ${newProxies.length} new discovered.`);

        let count = 0;
        let errors = 0;
        let firstError = '';

        if (newProxies.length > 0) {
            for (const p of newProxies) {
                try {
                    await (prisma as any).proxy.create({
                        data: {
                            host: p.host,
                            port: p.port,
                            type: p.type,
                            enabled: p.enabled,
                            status: p.status,
                            lastTestedAt: 'lastTestedAt' in p ? p.lastTestedAt : undefined
                        }
                    });
                    count++;
                } catch (err: any) {
                    // Try fallback for stale schema
                    try {
                        await (prisma as any).proxy.create({
                            data: {
                                host: p.host,
                                port: p.port,
                                type: p.type,
                                enabled: p.enabled
                            }
                        });
                        count++;
                        // If fallback works, don't increment error, but maybe log a warning once
                        if (!firstError) firstError = 'Schema mismatch: Saved without status fields.';
                    } catch (fallbackErr: any) {
                        errors++;
                        if (errors === 1) firstError = err.message;
                        if (errors <= 5) {
                            console.error(`[ProxyFetch] Insertion error:`, err.message);
                        }
                    }
                }
            }
        }

        const currentCount = await (prisma as any).proxy.count();
        console.log(`[ProxyFetch] Sync complete. Added ${count} new. Total in pool: ${currentCount}. Errors: ${errors}`);

        return NextResponse.json({
            success: true,
            sources: sources.map(s => s.name),
            logs: [
                ...logs,
                `[SYNC] Completed: ${count} added, ${processedProxies.length - newProxies.length} skipped duplicates.`,
                `[STATS] Total routing units in pool: ${currentCount}.`,
                ...(errors > 0 ? [`[WARN] ${errors} coordinate pairs failed to register. First Error: ${firstError}`] : [])
            ],
            count: count
        });

    } catch (error: any) {
        console.error('[ProxyFetch] Global error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch proxies',
            details: error.message
        }, { status: 500 });
    }
}
