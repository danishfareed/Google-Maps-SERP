import { NextResponse } from 'next/server';
import { Country, State, City } from 'country-state-city';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'city'; // 'city', 'country'
    const countryCode = searchParams.get('countryCode');
    const stateCode = searchParams.get('stateCode');

    try {
        if (type === 'country') {
            const countries = Country.getAllCountries();
            return NextResponse.json(countries.map(c => ({
                label: c.name,
                value: c.isoCode,
                emoji: c.flag
            })));
        }

        if (type === 'state') {
            if (!countryCode) return NextResponse.json([]);
            const states = State.getStatesOfCountry(countryCode);
            return NextResponse.json(states.map(s => ({
                label: s.name,
                value: s.isoCode
            })));
        }

        if (type === 'city') {
            // If country and state provided, filter effectively
            if (countryCode && stateCode) {
                const cities = City.getCitiesOfState(countryCode, stateCode);
                return NextResponse.json(cities.map(c => ({
                    label: c.name,
                    value: c.name,
                    lat: c.latitude,
                    lng: c.longitude
                })));
            }

            // Otherwise searching all cities (expensive, but library supports it?)
            // The library doesn't have a global "search" function efficiently.
            // Better to force user to select Country -> City or use the 160k city list intelligently.
            // For now, let's assume we return empty if no context, or just top cities.
            return NextResponse.json([]);
        }

        return NextResponse.json([]);
    } catch (error) {
        console.error('Location API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    }
}
