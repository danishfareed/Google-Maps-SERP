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
"[project]/src/lib/grid.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateGrid",
    ()=>generateGrid
]);
function generateGrid(centerLat, centerLng, radiusKm, gridSize) {
    const points = [];
    // 1 degree of latitude is ~111.111 km
    const latDelta = radiusKm / 111.111;
    // 1 degree of longitude is ~111.111 * cos(lat) km
    const lngDelta = radiusKm / (111.111 * Math.cos(centerLat * (Math.PI / 180)));
    const startLat = centerLat - latDelta;
    const startLng = centerLng - lngDelta;
    const latStep = latDelta * 2 / (gridSize - 1);
    const lngStep = lngDelta * 2 / (gridSize - 1);
    for(let i = 0; i < gridSize; i++){
        for(let j = 0; j < gridSize; j++){
            points.push({
                lat: startLat + i * latStep,
                lng: startLng + j * lngStep
            });
        }
    }
    return points;
}
}),
"[project]/src/lib/scraper.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "scrapeGMB",
    ()=>scrapeGMB
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__ = __turbopack_context__.i("[externals]/playwright [external] (playwright, esm_import, [project]/node_modules/playwright)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
async function scrapeGMB(keyword, lat, lng) {
    const browser = await __TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__["chromium"].launch({
        headless: true
    });
    const context = await browser.newContext({
        viewport: {
            width: 1280,
            height: 800
        },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    // Grant geolocation permissions
    await context.grantPermissions([
        'geolocation'
    ]);
    await context.setGeolocation({
        latitude: lat,
        longitude: lng
    });
    const page = await context.newPage();
    try {
        // Navigate to Google Maps
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${lat},${lng},14z/`, {
            waitUntil: 'networkidle',
            timeout: 60000
        });
        // Wait for the results list to appear - try multiple possible selectors
        try {
            await page.waitForSelector('[role="feed"]', {
                timeout: 15000
            });
        } catch (e) {
            console.log('Feed not found immediately, trying to interact...');
        }
        // Scroll to load more results (mimic user behavior)
        const feedSelector = '[role="feed"]';
        for(let i = 0; i < 4; i++){
            const feed = await page.$(feedSelector);
            if (feed) {
                await feed.evaluate((node)=>node.scrollTop += 2000);
            }
            await page.waitForTimeout(1000 + Math.random() * 2000);
        }
        // Extract results using more generic structure assumptions
        const results = await page.evaluate(()=>{
            // Helper to find text safely
            const getText = (el)=>el?.textContent?.trim() || '';
            const items = Array.from(document.querySelectorAll('div[role="article"]')); // often the main container for a result
            return items.slice(0, 20).map((item, index)=>{
                // Name is usually in a specialized font style or heading
                const nameEl = item.querySelector('.fontHeadlineSmall') || item.querySelector('[aria-label]');
                const name = getText(nameEl) || item.getAttribute('aria-label') || 'Unknown';
                // Rating often has aria-label "4.5 stars"
                const ratingEl = item.querySelector('[role="img"][aria-label*="stars"]') || item.querySelector('.fontBodyMedium span[role="img"]');
                const ratingLabel = ratingEl?.getAttribute('aria-label') || '';
                const ratingMatch = ratingLabel.match(/([0-9.]+)\s+stars/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
                // Reviews count often follows the rating
                const reviewsEl = item.querySelector('[aria-label*="reviews"]');
                const reviewsText = reviewsEl?.getAttribute('aria-label') || getText(reviewsEl);
                const reviews = reviewsText ? parseInt(reviewsText.replace(/[^0-9]/g, '')) : undefined;
                // Address is inconsistent, but often in the second line of text
                const container = item.closest('[jsaction]') || item;
                const textLines = container.innerText.split('\n');
                const address = textLines.length > 2 ? textLines.find((l)=>l.match(/\d+.*,.*\d+/)) || textLines[2] : '';
                return {
                    name: name.replace(/\. \d+$/, ''),
                    rating,
                    reviews,
                    address: address || '',
                    rank: index + 1
                };
            });
        });
        return results;
    } catch (error) {
        console.error(`Scrape failed for ${lat},${lng}:`, error);
        return [];
    } finally{
        await browser.close();
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/lib/scanner.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "runScan",
    ()=>runScan
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$grid$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/grid.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scraper$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/scraper.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scraper$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scraper$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
async function runScan(scanId) {
    const scan = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.findUnique({
        where: {
            id: scanId
        }
    });
    if (!scan) throw new Error('Scan not found');
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.update({
        where: {
            id: scanId
        },
        data: {
            status: 'RUNNING'
        }
    });
    const points = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$grid$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateGrid"])(scan.centerLat, scan.centerLng, scan.radius, scan.gridSize);
    for (const point of points){
        console.log(`Scraping point: ${point.lat}, ${point.lng}`);
        const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scraper$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["scrapeGMB"])(scan.keyword, point.lat, point.lng);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].result.create({
            data: {
                scanId: scan.id,
                lat: point.lat,
                lng: point.lng,
                topResults: JSON.stringify(results)
            }
        });
        // Delay between points to avoid detection
        await new Promise((resolve)=>setTimeout(resolve, 2000 + Math.random() * 3000));
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.update({
        where: {
            id: scanId
        },
        data: {
            status: 'COMPLETED'
        }
    });
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/api/scans/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scanner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/scanner.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scanner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scanner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
async function POST(req) {
    try {
        const { keyword, address, radius, gridSize } = await req.json();
        // In a real app, we'd geocode the address. 
        // For this POC, let's use a dummy center if not provided or just hardcode for testing.
        // Ideally use Google Maps Geocoding API or a free alternative.
        // LETS GOogle it or assume a fixed one for now or mock it.
        // MOCKING Geocoding Chicago center for now
        const centerLat = 41.8781;
        const centerLng = -87.6298;
        const scan = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.create({
            data: {
                keyword,
                centerLat,
                centerLng,
                radius: parseFloat(radius),
                gridSize: parseInt(gridSize),
                status: 'PENDING'
            }
        });
        // Run the scan in the background (fire and forget for now, or use a worker)
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scanner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["runScan"])(scan.id).catch(console.error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(scan);
    } catch (error) {
        console.error('API Error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to create scan'
        }, {
            status: 500
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1db37f5d._.js.map