import type { Zone, ZonePayload } from '../types';

const API_BASE_URL = "/api/zones";
const HEADERS = {
    'Content-Type': 'application/json',
    "ngrok-skip-browser-warning": "true"
};

export const ZoneClient = {
    // GET all zones
    async fetchAll(): Promise<Zone[]> {
        const response = await fetch(API_BASE_URL, {
            headers: {"ngrok-skip-browser-warning": "true" }
        });
        if (!response.ok) throw new Error("Failed to load zones:");
        return response.json();
    },

    // POST a new zone
    async create(payload: ZonePayload): Promise<Zone> {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    },

    // PUT (Update/ Rename)
    async update(id: number, payload: ZonePayload): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: HEADERS,
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await response.text());
    },

    // DELETE
    async remove (id:number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: {"ngrok-skip-browser-warning": "true" }
        });
        if (!response.ok) throw new Error("Delete failed");
    }
};