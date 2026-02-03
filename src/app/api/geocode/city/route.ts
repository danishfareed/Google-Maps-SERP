import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const country = searchParams.get('country');
    const type = searchParams.get('type') as 'zip' | 'neighborhood';

    if (!city || !type) {
        return NextResponse.json({ error: 'City and type are required' }, { status: 400 });
    }

    try {
        // Step 1: Get Exact City Boundary ID from Nominatim
        const q = [city, state, country].filter(Boolean).join(', ');
        console.log(`Geocoding city boundary for: ${q}`);

        const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&polygon_geojson=1&limit=1`,
            { headers: { 'User-Agent': 'GeoRanker/2.0' } }
        );

        const nomData = await nomRes.json();
        if (!nomData || nomData.length === 0) {
            return NextResponse.json({ error: 'City not found' }, { status: 404 });
        }

        const cityData = nomData[0];
        const osmId = cityData.osm_id;
        const osmType = cityData.osm_type; // 'relation', 'way', 'node'

        // Nominatim IDs need adjustment for Overpass (Relations need +3600000000 offset usually, 
        // OR we can just use the explicit "relation(id)" syntax which acts as an ID filter).
        // Actually, for Overpass "area" from relation, we accept the relation ID and add 3600000000.
        // But simpler: "rel(id); map_to_area -> .searchArea;"

        // Construct Overpass QL query using the exact ID
        let query = '';
        const areaId = osmType === 'relation' ? `relation(${osmId}); map_to_area->.searchArea;` :
            osmType === 'way' ? `way(${osmId}); map_to_area->.searchArea;` :
                `node(${osmId});`; // Node can't be an area really

        // Fallback for node cities (rare for big cities)
        if (osmType === 'node') {
            // Fallback to name search if node
            query = `area[name~"${city}",i]["admin_level"~"8|9|10"]->.searchArea;`;
        } else {
            query = areaId;
        }

        if (type === 'zip') {
            query += `
                (
                  relation["postal_code"](area.searchArea);
                  // Sometimes zip codes are ways or nodes too in some countries?
                  // Mostly relations for boundaries.
                );
                out center;
            `;
        } else {
            // Neighborhoods/Suburbs
            query += `
                (
                  node["place"~"suburb|neighbourhood|quarter"](area.searchArea);
                  way["place"~"suburb|neighbourhood|quarter"](area.searchArea);
                  relation["place"~"suburb|neighbourhood|quarter"](area.searchArea);
                );
                out center;
            `;
        }

        const encodedQuery = `[out:json][timeout:25];${query}`;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: encodedQuery
        });

        if (!response.ok) {
            throw new Error(`Overpass API failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Parse results into clean points
        const points = data.elements.map((el: any) => {
            const lat = el.lat || el.center?.lat;
            const lng = el.lon || el.center?.lon;
            const name = el.tags?.name || el.tags?.['postal_code'] || 'Unknown';

            if (lat && lng) {
                return { lat, lng, name, id: `${type}-${el.id}` };
            }
            return null;
        }).filter(Boolean);

        return NextResponse.json({
            points,
            cityMeta: {
                name: cityData.display_name,
                lat: parseFloat(cityData.lat),
                lng: parseFloat(cityData.lon)
            }
        });

    } catch (error) {
        console.error('Smart Grid Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to fetch city data' }, { status: 500 });
    }
}
