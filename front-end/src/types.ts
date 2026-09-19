// src/types.ts
import type { LatLngExpression } from 'leaflet';
import type {Dispatch, SetStateAction} from 'react';

export interface LatLng {
    lat: number;
    lng: number;
}

export interface Zone {
  id?: number;
  name: string;
  color: string;
  coordinates: string | LatLngExpression[];
}

//  interface for the payload in ZoneEditor.tsx
export interface ZonePayload {
    name: string;
    color: string;
    coordinates: string;
}

// Accept props for zones and setZones
export interface ZoneEditorProps {
    zones: Zone[];
    setZones: Dispatch<SetStateAction<Zone[]>>;
}