// src/modules/captain/CaptainsMap.tsx
import {MapContainer, TileLayer, Marker, Polygon, Popup, Polyline, Tooltip} from 'react-leaflet';
import type { Zone } from '../../types'; // Adjust path to your types file
import { GeoUtils } from '../../utils/GeoUtils';
import type { LatLng, LatLngExpression } from 'leaflet';
import {useEffect, useState, useCallback} from "react";
import {TrackingClient} from "../../api/TrackingClient.ts";

// interface for audio popup
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

// Define Props to accept the list
interface MapProps {
    zones: Zone[];
    role?: 'Captain' | 'Manager';
    userVesselId?: number | null;
}

// Interface for incoming GPS data
interface VesselPosition {
    id: number;
    vesselId: number;
    latitude: number;
    longitude: number;
    timestamp: string;
    status?: string;
    isOffline?: boolean;
}

// Alert interface
interface Alert {
    id: number;
    vesselId: number;
    zoneId?: number;
    alertType: string;
    timestamp: string;
    resolved: boolean;
}

export const CaptainsMap = ({ zones, role = 'Captain', userVesselId }: MapProps) => {

    // State for live tracking
    const [fleet, setFleet] = useState<VesselPosition[]>([]);

    // State for historical tracking
    const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
    const [historyPath, setHistoryPath] = useState<LatLngExpression[]>([]);

    // Time Filter state (shows the full path)
    const [timeFilter, setTimeFilter] = useState<number>(100);

    // Audio alert states
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

    // Alert state
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);

    // Radar like ping for the Desktop
    const playRadarPing = useCallback(() => {
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);

        // --- Create a fast, aggressive double pulse ---

        // Pulse 1: Start loud
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        // Hard stop at 0.15 seconds
        gain.gain.setValueAtTime(0.0, audioCtx.currentTime + 0.15);

        // Pulse 2: Start loud again at 0.2 seconds
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.2);
        // Hard stop at 0.35 seconds
        gain.gain.setValueAtTime(0.0, audioCtx.currentTime + 0.35);

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
    }, [audioCtx]); // Dependency array for callback

    // Audio unlocker handler
    const toggleAudio = () => {
        if (!isAudioEnabled) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const newCtx = new AudioContextClass();
            newCtx.resume();// unlock browser audio policy
            setAudioCtx(newCtx);
            setIsAudioEnabled(true);
        } else {
            if (audioCtx) audioCtx.close();
            setAudioCtx(null);
            setIsAudioEnabled(false);
        }
    };

    // Live Tracking & alerts radar
    useEffect(() => {
        const fetchFleetAndAlerts = async () => {
            try {
                // Fetch fleet
                const latestPositions = await TrackingClient.getLatest();
                const now = Date.now();

                // Calculate the offline status before it hits the UI
                const processedPositions = latestPositions.map((ship: VesselPosition) => {
                    const lastPingTime = new Date(ship.timestamp).getTime();
                    const minutesSinceLastPing = (now - lastPingTime) / 60000;
                    return {
                        ...ship,
                        isOffline: minutesSinceLastPing >  1  && ship.status != 'DOCKED' // Flag if older than 1 minute
                    };
                });

                if (role === 'Captain') {
                    if (!userVesselId) {
                        setFleet([]); // if captain has no ship assigned yet, show nothing
                        return;
                    }

                    const myShipOnly = processedPositions.filter((ship: VesselPosition) => ship.vesselId === userVesselId);
                    setFleet(myShipOnly);
                } else {
                    setFleet(processedPositions);
                }

                // Fetch active alerts for managers
                if (role === 'Manager') {
                    const response = await fetch('/api/alerts/active', {
                        headers: { "ngrok-skip-browser-warning": "true" }
                    });
                    if (response.ok) {
                        const alertsData = await response.json();
                        setActiveAlerts(alertsData); // Populate the panel
                    }
                }
            } catch (error) {
                console.error("Radar offline:", error);
            }
        };
        fetchFleetAndAlerts(); // fetch immediately on load
        const radarInterval = setInterval(fetchFleetAndAlerts, 3000); // Ping every 3 seconds
        return () => clearInterval(radarInterval); // cleanup on unmount
    }, [role, userVesselId]);

    // Alarm trigger: Every time fleet array updates if anyone is violating
    useEffect(() => {
        if (!isAudioEnabled || !audioCtx) return;
        // check if ANY ship currently on th radar has a violation status
        const hasViolation = fleet.some(ship => ship.status === 'VIOLATION');

        if (hasViolation) {
            playRadarPing();
        }
    }, [fleet, isAudioEnabled, audioCtx, playRadarPing]);

    // Historical tracking
    const handleShipClick = async (vesselId: number) => {
        setSelectedVesselId(vesselId);
        setTimeFilter(100); // (100% to show the full path)
        try {
            const history = await TrackingClient.getHistory(vesselId);
            // Convert the array of DTOs into an array of Leaflet [lat, lng] coordinates
            const pathCoords: LatLngExpression[] = history.map((pos: VesselPosition) => [pos.latitude, pos.longitude]);
            setHistoryPath(pathCoords);

        } catch (error) {
            console.error("Failed to load ship logs:", error);
        }
    };

    // Alert handler
    const handleResolve = async (alertId: number) => {
        try {
            const response = await fetch (`/api/alerts/${alertId}/resolve`, {
                method: 'PATCH',
                headers: { "ngrok-skip-browser-warning": "true"}
            });
            if (response.ok) {
                // Immediately remove it from the UI so it feels snappy
                setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
            } else {
                console.error("Failed to resolve alert");
            }
        } catch (error) {
            console.error("Error resolving alert:", error);
        }
    };

    // Calculate the filtered path based on the slider percentage
    const filteredPath = historyPath.slice(0, Math.floor((historyPath.length * timeFilter) / 100));

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>

            {/* --- AUDIO CONTROL BUTTON (FLOATING) --- */}
            <div style={{
                position: 'absolute', top: '20px', right: '20px', zIndex: 1000,
                background: 'white', padding: '10px 15px', borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '10px'
            }}>
                <strong style={{ fontSize: '14px', color: '#333' }}>Alert Audio:</strong>
                <button
                    onClick={toggleAudio}
                    style={{
                        padding: '6px 12px', borderRadius: '4px', border: 'none', fontWeight: 'bold',
                        cursor: 'pointer', color: 'white', transition: 'background 0.2s',
                        backgroundColor: isAudioEnabled ? '#d92d20' : '#666'
                    }}
                >
                    {isAudioEnabled ? '🔊 ARMED' : '🔇 MUTED'}
                </button>
            </div>

            {/* --- Manager Active Alerts Panel --- */}
            {role === 'Manager' && (
                <div style={{
                    position: 'absolute', top: '20px', left: '60px', zIndex: 1000,
                    background: 'white', padding: '15px', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '300px',
                    maxHeight: '400px', overflowY: 'auto'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#c62828', display: 'flex', justifyContent: 'space-between' }}>
                        Active Alerts
                        <span style={{ background: '#c62828', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                            {activeAlerts.length}
                        </span>
                    </h3>

                    {activeAlerts.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>All clear. No active violations.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {activeAlerts.map(alert => (
                                <div key={alert.id} style={{
                                    background: '#fff5f5', border: '1px solid #ffcdd2',
                                    padding: '10px', borderRadius: '6px', fontSize: '13px'
                                }}>
                                    <div style={{ fontWeight: 'bold', color: '#b71c1c', marginBottom: '4px' }}>
                                        {alert.alertType} (Vessel #{alert.vesselId})
                                    </div>
                                    <div style={{ color: '#666', fontSize: '11px', marginBottom: '8px' }}>
                                        {new Date(alert.timestamp).toLocaleTimeString()}
                                    </div>
                                    <button
                                        onClick={() => handleResolve(alert.id)}
                                        style={{
                                            background: '#4caf50', color: 'white', border: 'none',
                                            padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', width: '100%'
                                        }}
                                    >
                                        Acknowledge & Resolve
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>

                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />

                {zones.map(zone => {
                    // 1. Safely parse the coordinates just like we do in the Manager Editor
                    const safePositions = typeof zone.coordinates === 'string'
                        ? GeoUtils.toLeaflet(zone.coordinates)
                        : zone.coordinates;

                    return (
                        <Polygon
                            key={`${zone.id}-${zone.color}`} // Force color updates
                            pathOptions={{ color: zone.color }}
                            positions={safePositions}
                        >
                            <Popup>
                                <div style={{ minWidth: '160px' }}>
                                    {/* Header with Name and Status Badge */}
                                    <div style={{ borderBottom: '2px solid #eaecf0', paddingBottom: '6px', marginBottom: '8px' }}>
                                        <h4 style={{ margin: '0 0 4px 0' }}>{zone.name}</h4>
                                        <span style={{
                                            backgroundColor: zone.color === 'red' ? '#ffebee' : '#e8f5e9',
                                            color: zone.color === 'red' ? '#c62828' : '#2e7d32',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}>
                                        {zone.color === 'red' ? 'Restricted' : 'Permitted'}
                                    </span>
                                    </div>

                                    {/* The Scrollable Coordinates Box */}
                                    <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '6px', borderRadius: '4px' }}>
                                        {Array.isArray(safePositions) && safePositions.map((point: LatLngExpression, i: number) => {
                                            const lat = Array.isArray(point) ? point[0] : (point as LatLng).lat;
                                            const lng = Array.isArray(point) ? point[1] : (point as LatLng).lng;

                                            if (lat === undefined || lng === undefined) return null;

                                            return (
                                                <div key={i} style={{ marginBottom: '4px' }}>
                                                    <strong>P{i + 1}:</strong> {lat.toFixed(4)}, {lng.toFixed(4)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}


                {/* --- RENDER HISTORICAL PATH --- */}
                {selectedVesselId && filteredPath.length > 0 && (
                    <Polyline
                        positions={filteredPath}
                        pathOptions={{ color: '#007aff', weight: 4, dashArray: '10, 10' }}
                    />
                )}

                {/* --- RENDER LIVE FLEET --- */}
                {fleet.map(ship => {
                    // Safely ignore offline/ violation warning if the ship is legally docked
                    const isDocked = ship.status === 'DOCKED';
                    const isViolating = ship.status === 'VIOLATION' && !isDocked;
                    const isOffline = ship.isOffline && !isDocked; // Flag if older than 1 minute

                    return (
                        <Marker
                            key={ship.vesselId}
                            position={[ship.latitude, ship.longitude]}
                            opacity={isDocked ? 0.3 : (isOffline ? 0.5 : 1.0)} // Turn transparent if offline
                            eventHandlers={{ click: () => handleShipClick(ship.vesselId) }}
                        >
                            {/* Permanent Manager Tooltip */}
                            {role === 'Manager' && (isViolating || isOffline) && (
                                <Tooltip permanent direction="top" offset={[0, -20]}>
                                    {isOffline ? (
                                        <span style={{ color: '#e65100', fontWeight: 'bold' }}>📡 SIGNAL LOST</span>
                                    ) : (
                                        <span style={{ color: '#c62828', fontWeight: 'bold' }}>⚠️ VIOLATION</span>
                                    )}
                                </Tooltip>
                            )}

                            <Popup>
                                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                                    <strong style={{ fontSize: '15px' }}>Vessel #{ship.vesselId}</strong>

                                    {/* Safely Docked Badge */}
                                    {isDocked && (
                                        <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#e0e0e0', border: '1px solid #9e9e9e', color: '#424242', fontWeight: 'bold', borderRadius: '6px', fontSize: '12px' }}>
                                            ⚓ SAFELY DOCKED
                                        </div>
                                    )}

                                    {/* Offline Badge */}
                                    {isOffline && (
                                        <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#fff3e0', border: '1px solid #ff9800', color: '#e65100', fontWeight: 'bold', borderRadius: '6px', fontSize: '12px' }}>
                                            {role === 'Manager' ? '🚨 TAMPERING SUSPECTED' : '📡 SIGNAL LOST'}
                                        </div>
                                    )}

                                    {/* Violation Badge */}
                                    {isViolating && !isOffline && (
                                        <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#ffebee', border: '1px solid #f44336', color: '#c62828', fontWeight: 'bold', borderRadius: '6px', fontSize: '12px' }}>
                                            ⚠️ IN RESTRICTED ZONE
                                        </div>
                                    )}

                                    <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                                        Last Ping: {new Date(ship.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

            </MapContainer>

            {/* --- SLIDER UI OVERLAY (Floats over the map) --- */}
            {selectedVesselId && (
                <div style={{
                    position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000, background: 'white', padding: '15px', borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: '320px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                        <strong style={{ margin: 0, fontSize: '14px' }}>Vessel #{selectedVesselId} History</strong>
                        <button
                            onClick={() => { setSelectedVesselId(null); setHistoryPath([]); }}
                            style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                        >Close</button>
                    </div>

                    <input
                        type="range" min="1" max="100" value={timeFilter}
                        onChange={(e) => setTimeFilter(parseInt(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                        Showing {timeFilter}% of recorded trip
                    </div>
                </div>
            )}
        </div>
    );
};