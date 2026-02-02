module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = /*TURBOPACK member replacement*/ __turbopack_context__.g;
const prisma = globalForPrisma.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]();
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/src/app/api/proxies/fetch/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
;
;
async function POST() {
    console.log('[ProxyFetch] POST request received at /api/proxies/fetch');
    try {
        const sources = [
            {
                name: 'TheSpeedX',
                url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt'
            },
            {
                name: 'ShiftyTR',
                url: 'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt'
            },
            {
                name: 'Monosans',
                url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt'
            },
            {
                name: 'ProxyListPlus',
                url: 'https://raw.githubusercontent.com/mmpx12/proxy-list/master/http.txt'
            }
        ];
        // Safety Check: Check for active scans
        const activeScans = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.findFirst({
            where: {
                status: 'RUNNING'
            }
        });
        if (activeScans) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                logs: [
                    '[CAUTION] Active scan detected.',
                    '[ABORT] Proxy pool synchronization paused to prevent routing instability.'
                ],
                count: 0
            });
        }
        let allProxies = [];
        const logs = [];
        for (const source of sources){
            try {
                console.log(`[ProxyFetch] Fetching from ${source.name}: ${source.url}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(()=>controller.abort(), 8000); // 8s timeout per source
                const res = await fetch(source.url, {
                    next: {
                        revalidate: 3600
                    },
                    signal: controller.signal
                }).finally(()=>clearTimeout(timeoutId));
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const text = await res.text();
                const lines = text.split('\n').map((l)=>l.trim()).filter((l)=>l.includes(':') && l.length > 5);
                allProxies = [
                    ...allProxies,
                    ...lines
                ];
                console.log(`[ProxyFetch] ${source.name}: Got ${lines.length} proxies`);
                logs.push(`Fetched ${lines.length} proxies from ${source.name}`);
            } catch (err) {
                console.error(`[ProxyFetch] Failed ${source.name}:`, err.message);
                logs.push(`Failed to fetch from ${source.name}: ${err.message}`);
            }
        }
        console.log(`[ProxyFetch] Total unique potential proxies: ${new Set(allProxies).size}`);
        const uniqueEntries = Array.from(new Set(allProxies)).slice(0, 500);
        const proxyData = uniqueEntries.map((entry)=>{
            const [host, portStr] = entry.split(':');
            return {
                host,
                port: parseInt(portStr),
                type: 'DATACENTER',
                enabled: true
            };
        }).filter((p)=>p.host && !isNaN(p.port));
        console.log(`[ProxyFetch] Performing quality check on 100 discovered routing pairs...`);
        logs.push('Evaluating routing quality for 100 candidates...');
        const { validateProxyBatch } = await __turbopack_context__.A("[project]/src/lib/proxy-tester.ts [app-route] (ecmascript, async loader)");
        const testPool = proxyData.slice(0, 100);
        const testResults = await validateProxyBatch(testPool, 20);
        // Map all proxies to their final state
        const processedProxies = proxyData.map((p)=>{
            const testResult = testResults.find((r)=>r.host === p.host && r.port === p.port);
            if (testResult) {
                return {
                    ...p,
                    status: testResult.success ? 'ACTIVE' : 'DEAD',
                    lastTestedAt: new Date()
                };
            }
            return {
                ...p,
                status: 'UNTESTED'
            };
        });
        const activeCount = processedProxies.filter((p)=>p.status === 'ACTIVE').length;
        console.log(`[ProxyFetch] Quality Check: ${activeCount}/${testPool.length} verified routes.`);
        logs.push(`Quality Filter: Found ${activeCount} verified and ${proxyData.length - testPool.length} potential routes.`);
        console.log(`[ProxyFetch] Saving ${processedProxies.length} proxies to pool...`);
        // SQLite doesn't support skipDuplicates in createMany. 
        // We filter out existing proxies manually to avoid unique constraint violations.
        const existingProxies = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].proxy.findMany({
            select: {
                host: true,
                port: true
            }
        });
        const existingKeys = new Set(existingProxies.map((p)=>`${p.host}:${p.port}`));
        const newProxies = processedProxies.filter((p)=>!existingKeys.has(`${p.host}:${p.port}`));
        console.log(`[ProxyFetch] Pool has ${existingProxies.length} existing. Detected ${newProxies.length} new unique from ${processedProxies.length} candidates.`);
        logs.push(`Deduplication: ${existingKeys.size} already in pool, ${newProxies.length} new discovered.`);
        let count = 0;
        let errors = 0;
        let firstError = '';
        if (newProxies.length > 0) {
            for (const p of newProxies){
                try {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].proxy.create({
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
                } catch (err) {
                    // Try fallback for stale schema
                    try {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].proxy.create({
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
                    } catch (fallbackErr) {
                        errors++;
                        if (errors === 1) firstError = err.message;
                        if (errors <= 5) {
                            console.error(`[ProxyFetch] Insertion error:`, err.message);
                        }
                    }
                }
            }
        }
        const currentCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].proxy.count();
        console.log(`[ProxyFetch] Sync complete. Added ${count} new. Total in pool: ${currentCount}. Errors: ${errors}`);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            sources: sources.map((s)=>s.name),
            logs: [
                ...logs,
                `[SYNC] Completed: ${count} added, ${processedProxies.length - newProxies.length} skipped duplicates.`,
                `[STATS] Total routing units in pool: ${currentCount}.`,
                ...errors > 0 ? [
                    `[WARN] ${errors} coordinate pairs failed to register. First Error: ${firstError}`
                ] : []
            ],
            count: count
        });
    } catch (error) {
        console.error('[ProxyFetch] Global error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Failed to fetch proxies',
            details: error.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4044e370._.js.map