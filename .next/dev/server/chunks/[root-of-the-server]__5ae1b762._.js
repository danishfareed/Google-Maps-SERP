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
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/grid.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateGrid",
    ()=>generateGrid
]);
function generateGrid(centerLat, centerLng, radiusKm, gridSize, shape = 'SQUARE') {
    if (shape === 'CIRCLE') {
        return generateCircleGrid(centerLat, centerLng, radiusKm, gridSize);
    }
    if (shape === 'ZIP') {
        return generateZipGrid(centerLat, centerLng, radiusKm, gridSize);
    }
    if (shape === 'SMART') {
        return generateSmartGrid(centerLat, centerLng, radiusKm);
    }
    const points = [];
    const latDelta = radiusKm / 111.111;
    const lngDelta = radiusKm / (111.111 * Math.cos(centerLat * (Math.PI / 180)));
    const startLat = centerLat - latDelta;
    const startLng = centerLng - lngDelta;
    const latStep = latDelta * 2 / (gridSize - 1);
    const lngStep = lngDelta * 2 / (gridSize - 1);
    for(let i = 0; i < gridSize; i++){
        for(let j = 0; j < gridSize; j++){
            points.push({
                lat: startLat + i * latStep,
                lng: startLng + j * lngStep,
                id: `sq-${i}-${j}`
            });
        }
    }
    return points;
}
function generateCircleGrid(centerLat, centerLng, radiusKm, gridSize) {
    const points = [];
    points.push({
        lat: centerLat,
        lng: centerLng,
        id: 'center'
    }); // Always include center
    const rings = Math.floor(gridSize / 2);
    if (rings < 1) return points;
    for(let r = 1; r <= rings; r++){
        const ringRadius = radiusKm * r / rings;
        const numPoints = r * 6; // Hexagonal-ish distribution
        for(let i = 0; i < numPoints; i++){
            const angle = i * 360 / numPoints;
            const bearing = angle * (Math.PI / 180);
            // Haversine-ish approximate offset
            const latOffset = ringRadius / 111.111 * Math.cos(bearing);
            const lngOffset = ringRadius / (111.111 * Math.cos(centerLat * (Math.PI / 180))) * Math.sin(bearing);
            points.push({
                lat: centerLat + latOffset,
                lng: centerLng + lngOffset,
                id: `circle-${r}-${i}`
            });
        }
    }
    return points;
}
function generateZipGrid(centerLat, centerLng, radiusKm, gridSize) {
    const points = [];
    // For Zip mode, we cluster pins semi-randomly but concentrated in sub-sectors
    // In a real app, this would query a zip-code boundary API
    const sectors = 4;
    const pointsPerSector = Math.ceil(gridSize * gridSize / sectors);
    for(let s = 0; s < sectors; s++){
        const sectorAngle = s * 360 / sectors;
        const bearing = sectorAngle * (Math.PI / 180);
        // Sector center
        const sLat = centerLat + radiusKm * 0.6 / 111.111 * Math.cos(bearing);
        const sLng = centerLng + radiusKm * 0.6 / (111.111 * Math.cos(centerLat * (Math.PI / 180))) * Math.sin(bearing);
        for(let i = 0; i < pointsPerSector; i++){
            const jitter = 0.2 * radiusKm;
            const jLat = (Math.random() - 0.5) * jitter / 111.111;
            const jLng = (Math.random() - 0.5) * jitter / (111.111 * Math.cos(sLat * (Math.PI / 180)));
            points.push({
                lat: sLat + jLat,
                lng: sLng + jLng,
                id: `zip-${s}-${i}`
            });
        }
    }
    return points;
}
function generateSmartGrid(centerLat, centerLng, radiusKm) {
    const points = [];
    const R = 6371; // Earth's radius in km
    // Smart grid focused on center
    points.push({
        lat: centerLat,
        lng: centerLng,
        id: 'smart-center'
    });
    // Ring configuration: [distanceFromCenterInKm, pointSpacingInKm]
    // We scale this based on the total radius requested
    const ringConfigs = [
        {
            dist: 0.15,
            spacing: 0.3
        },
        {
            dist: 0.4,
            spacing: 0.5
        },
        {
            dist: 0.8,
            spacing: 0.8
        },
        {
            dist: 1.5,
            spacing: 1.2
        },
        {
            dist: 3.0,
            spacing: 2.0
        },
        {
            dist: 6.0,
            spacing: 4.0
        },
        {
            dist: 12.0,
            spacing: 8.0
        }
    ];
    ringConfigs.forEach((ring, ringIdx)=>{
        // Adjust ring distance relative to the requested radius
        // If radius is 3km, we don't want points at 12km
        if (ring.dist * (radiusKm / 3) > radiusKm && ringIdx > 1) return;
        const actualDist = ring.dist * (radiusKm / 3);
        const actualSpacing = ring.spacing * (radiusKm / 3);
        const circumference = 2 * Math.PI * actualDist;
        const numPoints = Math.max(3, Math.floor(circumference / actualSpacing));
        const angleStep = 2 * Math.PI / numPoints;
        for(let i = 0; i < numPoints; i++){
            const angle = angleStep * i;
            // Haversine approximation for small distances
            const latOffset = actualDist / 111.111 * Math.cos(angle);
            const lngOffset = actualDist / (111.111 * Math.cos(centerLat * (Math.PI / 180))) * Math.sin(angle);
            points.push({
                lat: centerLat + latOffset,
                lng: centerLng + lngOffset,
                id: `smart-${ringIdx}-${i}`
            });
        }
    });
    return points;
}
}),
"[project]/src/lib/scraper.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "scrapeGMB",
    ()=>scrapeGMB
]);
async function scrapeGMB(page, keyword, lat, lng) {
    try {
        console.log(`[Scraper] Navigating to: https://www.google.com/maps/search/${keyword}/@${lat},${lng},14z/`);
        // Use a 30s timeout for the initial load, wait for domcontentloaded
        // If this fails, it's likely a dead proxy or a block
        try {
            await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${lat},${lng},14z/`, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
        } catch (gotoError) {
            console.error(`[Scraper] Page goto failed: ${gotoError.message}`);
            throw gotoError; // Rethrow to be caught by the scanner's retry logic
        }
        // Wait for results to load - use multiple common selectors
        try {
            await page.waitForFunction(()=>{
                return !!(document.querySelector('[role="article"]') || document.querySelector('.qBF1Pd') || document.querySelector('[role="feed"]'));
            }, {
                timeout: 20000
            });
        } catch (e) {
            console.log('[Scraper] Warning: Standard result selectors not found, trying fallback extraction anyway.');
        }
        // Mimic human scrolling behavior
        for(let i = 0; i < 3; i++){
            await page.evaluate(()=>{
                const scrollable = document.querySelector('[role="feed"]') || document.body;
                scrollable.scrollBy(0, 800);
            });
            await page.waitForTimeout(1000 + Math.random() * 1000);
        }
        // Extract results with robust, multiple-path selectors
        // We use a self-invoking function string to avoid any transpilation artifacts like __name
        const results = await page.evaluate(()=>{
            const extracted = [];
            // Priority 1: Articles with specific roles
            let items = Array.from(document.querySelectorAll('div[role="article"]'));
            // Priority 2: Links that look like place profiles
            if (items.length === 0) {
                const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
                items = links.map((l)=>l.closest('div') || l).filter(Boolean);
            }
            const seenNames = new Set();
            items.forEach((item)=>{
                if (extracted.length >= 20) return;
                let name = '';
                const ariaLabel = item.getAttribute('aria-label');
                if (ariaLabel && !ariaLabel.includes('stars') && ariaLabel.length > 2) {
                    name = ariaLabel;
                }
                // Strategy B: Specific class signatures
                if (!name) {
                    const nameEl = item.querySelector('.fontHeadlineSmall, .qBF1Pd, [role="heading"]');
                    name = nameEl?.textContent?.trim() || '';
                }
                if (!name || name.length < 2) return;
                name = name.split(' · ')[0].replace(/\. \d+$/, '').trim();
                if (seenNames.has(name.toLowerCase())) return;
                seenNames.add(name.toLowerCase());
                // URL/Link Extraction
                const linkEl = item.querySelector('a[href*="/maps/place/"]') || item.closest('a[href*="/maps/place/"]');
                const url = linkEl ? linkEl.href : '';
                // Rating & Reviews extraction
                const ratingEl = item.querySelector('[role="img"][aria-label*="stars"]');
                const ratingLabel = ratingEl?.getAttribute('aria-label') || '';
                const ratingMatch = ratingLabel.match(/([0-9.]+)\s+stars/);
                const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
                const reviewsMatch = ratingLabel.match(/\(([\d,]+)\)/) || ratingLabel.match(/([\d,]+)\s+reviews/);
                const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(/,/g, '')) : 0;
                const text = item.innerText || '';
                const lines = text.split('\n');
                const address = lines.find((l)=>l.match(/\d+/) && l !== name && l.length > 5) || '';
                extracted.push({
                    name,
                    rating,
                    reviews,
                    address: address.trim(),
                    url,
                    rank: extracted.length + 1
                });
            });
            return extracted;
        });
        console.log(`[Scraper] Successfully extracted ${results.length} results.`);
        return results;
    } catch (error) {
        console.error(`[Scraper] Error scraping ${lat},${lng}:`, error);
        throw error; // Re-throw to trigger scanner's retry/rotation logic
    }
}
}),
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
var __TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__ = __turbopack_context__.i("[externals]/playwright [external] (playwright, esm_import, [project]/node_modules/playwright)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
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
    const points = scan.customPoints ? JSON.parse(scan.customPoints) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$grid$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateGrid"])(scan.centerLat, scan.centerLng, scan.radius, scan.gridSize, scan.shape);
    // Initial fetch of proxy settings
    const proxySetting = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].globalSetting.findUnique({
        where: {
            key: 'useSystemProxy'
        }
    });
    const useSystemProxy = proxySetting ? proxySetting.value === 'true' : true;
    let browser = null;
    let context = null;
    let page = null;
    let currentProxyId = null;
    async function initBrowser(failedProxyId) {
        if (browser) await browser.close();
        // If a proxy failed, mark it DEAD in the database immediately
        if (failedProxyId) {
            console.log(`[Scanner] Marking proxy ${failedProxyId} as DEAD due to connection failure.`);
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].proxy.update({
                    where: {
                        id: failedProxyId
                    },
                    data: {
                        status: 'DEAD',
                        lastTestedAt: new Date()
                    }
                });
            } catch (err) {
                console.error('[Scanner] Failed to update proxy status:', err);
            }
        }
        const launchOptions = {
            headless: true
        };
        if (!useSystemProxy) {
            // Fetch healthy proxies (ACTIVE or UNTESTED)
            const availableProxies = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].proxy.findMany({
                where: {
                    enabled: true,
                    status: {
                        in: [
                            'ACTIVE',
                            'UNTESTED'
                        ]
                    }
                }
            });
            if (availableProxies.length > 0) {
                // Prioritize ACTIVE proxies if available, otherwise use UNTESTED
                const activeOnes = availableProxies.filter((p)=>p.status === 'ACTIVE');
                const pool = activeOnes.length > 0 ? activeOnes : availableProxies;
                const p = pool[Math.floor(Math.random() * pool.length)];
                currentProxyId = p.id;
                launchOptions.proxy = {
                    server: `http://${p.host}:${p.port}`,
                    username: p.username || undefined,
                    password: p.password || undefined
                };
                console.log(`[Scanner] Initializing with ${p.status} proxy: ${p.host}:${p.port}`);
            } else {
                console.log(`[Scanner] No healthy proxies available. Falling back to direct connection.`);
            }
        } else {
            console.log(`[Scanner] Initializing Direct System Connection`);
        }
        browser = await __TURBOPACK__imported__module__$5b$externals$5d2f$playwright__$5b$external$5d$__$28$playwright$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$playwright$29$__["chromium"].launch(launchOptions);
        context = await browser.newContext({
            viewport: {
                width: 1280,
                height: 800
            },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        await context.grantPermissions([
            'geolocation'
        ]);
        page = await context.newPage();
    }
    try {
        await initBrowser();
        for (const point of points){
            // Check if scan has been stopped
            const currentScan = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.findUnique({
                where: {
                    id: scanId
                },
                select: {
                    status: true
                }
            });
            if (!currentScan || currentScan.status === 'STOPPED') {
                console.log(`Scan ${scanId} was stopped.`);
                break;
            }
            console.log(`Scraping point: ${point.lat}, ${point.lng}`);
            let results = [];
            let success = false;
            let attempts = 0;
            const maxAttempts = 3;
            while(!success && attempts < maxAttempts){
                attempts++;
                try {
                    await context.setGeolocation({
                        latitude: point.lat,
                        longitude: point.lng
                    });
                    results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scraper$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["scrapeGMB"])(page, scan.keyword, point.lat, point.lng);
                    success = true;
                } catch (scrapeError) {
                    console.error(`[Scanner] Attempt ${attempts} failed for point ${point.lat},${point.lng}: ${scrapeError.message}`);
                    if (attempts < maxAttempts) {
                        const isProxyError = scrapeError.message.includes('ERR_PROXY_CONNECTION_FAILED') || scrapeError.message.includes('ERR_TUNNEL_CONNECTION_FAILED') || scrapeError.message.includes('TIMEOUT');
                        console.log(`[Scanner] Retrying with new proxy rotation...`);
                        await initBrowser(isProxyError ? currentProxyId || undefined : undefined);
                    }
                }
            }
            if (!success) {
                console.error(`[Scanner] Failed to scrape point ${point.lat},${point.lng} after ${maxAttempts} attempts.`);
                // We create a result with empty data to allow the scan to continue but show the failure
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].result.create({
                    data: {
                        scanId: scan.id,
                        lat: point.lat,
                        lng: point.lng,
                        topResults: JSON.stringify([]),
                        rank: null
                    }
                });
                continue;
            }
            let rank = null;
            let targetName = null;
            if (scan.businessName) {
                const match = results.find((r)=>r.name.toLowerCase().includes(scan.businessName.toLowerCase()));
                if (match) {
                    rank = match.rank;
                    targetName = match.name;
                }
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].result.create({
                data: {
                    scanId: scan.id,
                    lat: point.lat,
                    lng: point.lng,
                    topResults: JSON.stringify(results),
                    rank,
                    targetName
                }
            });
            // Random delay between points
            await new Promise((resolve)=>setTimeout(resolve, 2000 + Math.random() * 3000));
        }
        // Calculate NEXT RUN if recurring
        let nextRun = null;
        if (scan.frequency === 'DAILY') {
            nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else if (scan.frequency === 'WEEKLY') {
            nextRun = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        // Check for rank changes and create alerts
        if (scan.businessName) {
            const previousScan = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.findFirst({
                where: {
                    keyword: scan.keyword,
                    businessName: scan.businessName,
                    status: 'COMPLETED',
                    id: {
                        not: scanId
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    results: true
                }
            });
            if (previousScan) {
                const currentResults = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].result.findMany({
                    where: {
                        scanId
                    }
                });
                const currentAvg = currentResults.filter((r)=>r.rank !== null).reduce((acc, r)=>acc + (r.rank || 21), 0) / (currentResults.filter((r)=>r.rank !== null).length || 1);
                const previousAvg = previousScan.results.filter((r)=>r.rank !== null).reduce((acc, r)=>acc + (r.rank || 21), 0) / (previousScan.results.filter((r)=>r.rank !== null).length || 1);
                const diff = previousAvg - currentAvg;
                if (Math.abs(diff) >= 0.5) {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].alert.create({
                        data: {
                            type: diff > 0 ? 'RANK_UP' : 'RANK_DOWN',
                            message: `${scan.businessName} rank ${diff > 0 ? 'improved' : 'dropped'} by ${Math.abs(diff).toFixed(1)} points for "${scan.keyword}"`,
                            scanId: scan.id
                        }
                    });
                }
            }
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.update({
            where: {
                id: scanId
            },
            data: {
                status: 'COMPLETED',
                nextRun
            }
        });
    } catch (error) {
        console.error(`[Scanner] Critical failure in scan ${scanId}:`, error);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.update({
            where: {
                id: scanId
            },
            data: {
                status: 'FAILED'
            }
        });
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].alert.create({
            data: {
                type: 'SCAN_ERROR',
                message: `Scan failed for "${scan.keyword}": ${error instanceof Error ? error.message : String(error)}`,
                scanId: scanId
            }
        });
    } finally{
        if (browser) await browser.close();
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/api/scans/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scanner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/scanner.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scanner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scanner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
async function GET() {
    try {
        const scans = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            scans
        });
    } catch (error) {
        console.error('Scans GET error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            scans: []
        });
    }
}
async function POST(req) {
    try {
        const { keyword, radius, gridSize, frequency, businessName, shape, customPoints, lat, lng } = await req.json();
        // Use provided coordinates or default to Chicago (Mock)
        const centerLat = lat || 41.8781;
        const centerLng = lng || -87.6298;
        const scan = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].scan.create({
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
                status: 'PENDING'
            }
        });
        // Start scan in background
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scanner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["runScan"])(scan.id).catch(console.error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(scan);
    } catch (error) {
        console.error('Scan creation CRITICAL error:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to create scan',
            details: String(error)
        }, {
            status: 500
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5ae1b762._.js.map