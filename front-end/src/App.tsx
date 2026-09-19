// src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './layout/Layout';
import { CaptainsMap } from './modules/captain/CaptainsMap';
import { ZoneEditor } from './modules/manager/ZoneEditor';
import Accounts from './modules/manager/Accounts';
import Logbook from './modules/captain/Logbook';
import TrackTrip from "./modules/captain/TrackTrip";
import CaptainQuota from "./modules/captain/captainQuota";
import Dashboard from "./modules/manager/dashboard";
import Quota from "./modules/manager/Quota";
import LoginScreen from './modules/components/LoginScreen';

import type { Zone } from './types';
import './App.css';

// --- TYPES ---
export interface User {
    user_id?: number;
    first_name: string;
    last_name: string;
    email: string;
    password?: string;          // write-only on backend; absent in GET responses
    role: 'Manager' | 'Captain';
    vessel: Vessel | null;
}

export interface Vessel {
    vessel_id?: number;
    vessel_name: string;
}

// Define what DB sends (GeoJson format)
interface GeoJsonPolygon {
    type: "Polygon";
    coordinates: number[][][];
}

// Define raw incoming DB object using an interface
interface RawZone {
    id?: number;
    name: string;
    color: string;
    coordinates: string | GeoJsonPolygon;
}

const API_BASE_URL = "/api";

const HEADERS = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
};

function App() {
    // 1. STATE
    const [zones, setZones] = useState<Zone[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [vessels, setVessels] = useState<Vessel[]>([]);
    const [userLoggedIn, setUserLoggedIn] = useState<User | null>(null);
    const [loadingData, setLoadingData] = useState(true);


    // --- EFFECT 1: Map Zones And Live Polling (Noman) ---
    useEffect(() => {
        const fetchZones = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/zones`, {
                    headers: {
                        "ngrok-skip-browser-warning" : "true"
                    }
                });
                if (response.ok) {
                    const data = await response.json();


                    // Flip coordinates back from [Lng, Lat] to [Lat, Lng]
                    const formattedZones = data.map((zone: RawZone) => {
                        // Parse the string from the DB into GeoJsonPolygon type
                        const geoJson = typeof zone.coordinates === 'string'
                            ? JSON.parse(zone.coordinates) as GeoJsonPolygon
                            : zone.coordinates as GeoJsonPolygon;

                        // Safety - if geoJson is missing coordinates. return a default
                        if (!geoJson || !geoJson.coordinates) {
                            return {...zone, coordinates: [] };
                        }

                        // GeoJSON Polygons are nested, where coordinates[0] is the exterior ring
                        const leafletCoords = geoJson.coordinates[0].map((pair: number[]) => [
                            pair[1], // Latitude (was second)
                            pair[0] // Longitude (was first)
                        ]);

                        return {
                            ...zone,
                            coordinates: leafletCoords
                        };
                    });
                    // Update React state only if the data changes
                    setZones(prevZones => {
                        // Compare the old map data to the newly formatted map data
                        if (JSON.stringify(prevZones) === JSON.stringify(formattedZones)) {
                            return prevZones; // Data is identical. Do NOT re-render!
                        }
                        return formattedZones; // Data changed! Update the map.
                    });
                }
            } catch (error) {
                console.error("Error catching to backend:", error);
            }
        };
        fetchZones();

        // Check the database for Manager edits every 5 seconds
        const zoneInterval = setInterval(fetchZones, 5000);
        return () => clearInterval(zoneInterval);
    }, []); // Empty dependency array that runs when the app runs

    // --- EFFECT 2: Initial Users and Vessels Fetch (Joan)
    useEffect(() => {
        async function loadInitialData() {
            try {
                const [usersRes, vesselsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/users`, { headers: { "ngrok-skip-browser-warning": "true" } }),
                    fetch(`${API_BASE_URL}/vessels`, { headers: { "ngrok-skip-browser-warning": "true" } })
                ]);

                if (!usersRes.ok || !vesselsRes.ok) {
                    throw new Error('Failed to load data from server');
                }

                setUsers(await usersRes.json());
                setVessels(await vesselsRes.json());
            } catch (err) {
                console.error('Could not reach backend:', err);
                alert('Could not connect to the server. Make sure backend is running.');
            } finally {
                setLoadingData(false);
            }
        }
        loadInitialData();
    }, []);

    //API helpers

    // Login: find user by email+password (done client-side from the fetched list
    // because the backend has no dedicated /login endpoint yet).
    // The password comparison works only if the backend returns plain-text passwords,
    // which it does NOT (BCrypt). A proper /login endpoint is added on the backend
    // side; see UserController. This handler is called from LoginScreen after the
    // backend responds with the matched user.
    // --- AUTH AND ACCOUNT HANDLERS (Joan)
    const handleLogin = (user: User) => {
        setUserLoggedIn(user);
    };

    const handleLogout = () => {
        setUserLoggedIn(null);
    };

    // Create user: POST to backend, then add to local state
    const createUser = async (user: Omit<User, 'user_id'>): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(user)
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to create user');
        }
        const created: User = await res.json();
        setUsers(prev => [...prev, created]);
    };

    // Update user: PUT to backend, then update local state
    const updateUser = async (id: number, user: Partial<User>): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: HEADERS,
            body: JSON.stringify(user)
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to update user');
        }
        const updated: User = await res.json();
        setUsers(prev => prev.map(u => u.user_id === id ? updated : u));
        // Keep logged-in user in sync if they edited their own account
        if (userLoggedIn?.user_id === id) setUserLoggedIn(updated);
    };

    // Delete user: DELETE on backend, then remove from local state
    const deleteUser = async (id: number): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to delete user');
        }
        setUsers(prev => prev.filter(u => u.user_id !== id));
    };

    // Create vessel: POST to backend
    const createVessel = async (name: string): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/vessels`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ vessel_name: name })
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to create vessel');
        }
        const created: Vessel = await res.json();
        setVessels(prev => [...prev, created]);
    };

    // Update vessel: PUT to backend
    const updateVessel = async (id: number, name: string): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/vessels/${id}`, {
            method: 'PUT',
            headers: HEADERS,
            body: JSON.stringify({ vessel_name: name })
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to update vessel');
        }
        const updated: Vessel = await res.json();
        setVessels(prev => prev.map(v => v.vessel_id === id ? updated : v));
    };

    // Delete vessel: DELETE on backend
    const deleteVessel = async (id: number): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/vessels/${id}`, {
            method: 'DELETE',
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || 'Failed to delete vessel');
        }
        setVessels(prev => prev.filter(v => v.vessel_id !== id));
    };

    // Loading state

    if (loadingData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Connecting to server...</p>
            </div>
        );
    }

    //Auth guard

    if (!userLoggedIn) {
        return (
            <LoginScreen
                users={users}
                onLogin={handleLogin}
                createUser={createUser}
            />
        );
    }


    // --- RENDER APP ---
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout role={userLoggedIn.role} onLogout={handleLogout} />}>

                    {/* --- CAPTAIN ROUTES --- */}
                    {userLoggedIn.role === 'Captain' && (
                        <>
                            <Route path="captain/map" element={<CaptainsMap zones={zones} role="Captain" userVesselId={userLoggedIn.vessel?.vessel_id}/>} />
                            <Route path="captain/logbook" element={<Logbook user={userLoggedIn}/>} />
                            <Route path="captain/track-trip" element={<TrackTrip user={userLoggedIn} />} />
                            <Route path="captain/quotas" element={<CaptainQuota user={userLoggedIn} />} />
                            <Route index element={<Navigate to="/captain/map" replace />} />
                        </>
                    )}

                    {/* --- MANAGER ROUTES --- */}
                    {userLoggedIn.role === 'Manager' && (
                        <>
                            <Route path="manager/dashboard" element={<Dashboard />} />
                            <Route path="manager/quotas" element={<Quota />} />
                            <Route path="manager/map" element={<CaptainsMap zones={zones} role="Manager" />} />
                            <Route path="manager/quotas" element={<Quota />} />
                            <Route path="manager/zones" element={<ZoneEditor zones={zones} setZones={setZones} />} />
                            <Route
                                path="manager/accounts"
                                element={
                                    <Accounts
                                        users={users}
                                        vessels={vessels}
                                        userLoggedIn={userLoggedIn}
                                        createUser={createUser}
                                        updateUser={updateUser}
                                        deleteUser={deleteUser}
                                        createVessel={createVessel}
                                        updateVessel={updateVessel}
                                        deleteVessel={deleteVessel}
                                    />
                                }
                            />
                            <Route index element={<Navigate to="/manager/dashboard" replace />} />
                        </>
                    )}

                    {/* --- FALLBACK --- */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App;
