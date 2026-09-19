import type { LatLng } from '../types';
import type { LatLngExpression } from 'leaflet';

export const GeoUtils = {
    // Converts Leaflet coordinates into a valid GeoJson Polygon object,
    // Automatically handles flipping to [Lng, Lat] and closing the polygon.

    toGeoJSON: (leafletCoords: LatLngExpression[]) => {
        const flippedCoordinates = leafletCoords.map((coords) => {
            if (Array.isArray(coords)) {
                return [coords[1], coords[0]];
            }
            const c = coords as LatLng;
            return [c.lng, c.lat];
        });

        const firstPoint = flippedCoordinates[0];
        const lastPoint = flippedCoordinates[flippedCoordinates.length - 1];
        let closedCoordinates = flippedCoordinates;

        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
            closedCoordinates = [...flippedCoordinates, firstPoint];
        }

        return {
            type: "Polygon",
            coordinates: [closedCoordinates]
        };
    },

    // Converts a backend GeoJSON string (or object) back into Leaflet [Lat, Lng] arrays
    toLeaflet: (geoJsonData: string | { coordinates: number[][][] }) => {
        const parsed = typeof geoJsonData === 'string' ? JSON.parse(geoJsonData) : geoJsonData;
        return parsed.coordinates[0].map((pair: number[]) => [pair[1], pair[0]]);
    }
};