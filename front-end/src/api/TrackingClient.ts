
export interface VesselPosition {
    id: number;
    vesselId: number;
    longitude: number;
    latitude: number;
    timestamp: string;
}

const HEADERS = {
    'Content-Type': 'application/json',
    "ngrok-skip-browser-warning": "true"
};

export const TrackingClient = {
    // endpoint to be added to Spring boot
    pingLocation: async (deviceId: number, lat: number, lng: number) => {
        const response = await fetch(`/api/tracking/ping`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ vesselId: deviceId, latitude: lat, longitude: lng})
        });
        if (!response.ok) throw new Error("Failed to ping location");
        // return text to check for violations
        return response.text();
    },

    // Live tracking: Get the vessel's current status
    getLatest: async (): Promise <VesselPosition[]> => {
        const response = await fetch(`/api/tracking/latest`, {
            headers: HEADERS
        });
        if (!response.ok) throw new Error("Failed to fetch fleet");
        return response.json();
    },

    // Historical tracking of a single vessel
    getHistory: async (vesselId: number): Promise<VesselPosition[]> => {
        const response = await fetch(`/api/tracking/history/${vesselId}`, {
            headers: HEADERS
        });
        if (!response.ok) throw new Error("Failed to fetch history");
        return response.json();
    }
};