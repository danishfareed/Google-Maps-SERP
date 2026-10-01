/**
 * Basemap tile source — OpenStreetMap standard tiles.
 *
 * No API key, no account, no sign-up. CARTO (the previous provider) now
 * serves an "API KEY REQUIRED" watermark instead of map data, which is why
 * every map rendered blank.
 *
 * Attribution is required by OSM's tile usage policy, as is keeping request
 * volume modest — see the lazy-mount note in MiniMap.
 */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Max zoom OSM standard tiles provide. */
export const TILE_MAX_ZOOM = 19;

/**
 * Resolve a bundled image import to a URL.
 *
 * Next's type declarations say a `*.png` import is a `StaticImageData` object,
 * but Turbopack emits a plain URL string for images resolved out of
 * node_modules. TypeScript accepts `.src` either way, so the mismatch only
 * shows up at runtime as Leaflet's "iconUrl not set in Icon options".
 */
export function assetUrl(img: unknown): string {
    if (typeof img === 'string') return img;
    if (img && typeof img === 'object' && 'src' in img) {
        return String((img as { src: unknown }).src);
    }
    return '';
}
