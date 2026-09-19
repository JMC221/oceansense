import { useEffect, useState, useCallback } from "react";
import type { User } from "../../App.tsx";
import { TrackingClient } from "../../api/TrackingClient";

// This matches the Trip entity returned by the backend
type Trip = {
    tripId: number;
    captainId: number;
    vesselId: number;
    startTime: string;
    endTime: string | null;
    status: string;
};

const API_BASE_URL = "/api";

// temporary fixed IDs based on seed data in schema.sql
// later it can be replaced by logged-in user data.

function TrackTrip({ user }: { user: User}) {
    // Stores either the active trip, latest trip, or null if none exists
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

    // Used to disable buttons during requests
    const [loading, setLoading] = useState(false);

    // Simple user feedback message
    const [message, setMessage] = useState("");

    // GPS and Audio State (Noman's code snippet)
    const [currentPos, setCurrentPos] = useState<{lat: number, lng: number} | null>(null);
    const [gpsStatus, setGpsStatus] = useState("Standing By");
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

    const tripIsActive =
        activeTrip !== null &&
        activeTrip.endTime === null &&
        activeTrip.status?.toLowerCase() === "active";

    // --- ALARM BEEP FUNCTION (Noman's code snippet)
    // Native Browser Alarm Beep
    const playAlarmBeep = useCallback(() =>
    {
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
    }, [audioCtx]);

    // Load trips from the backend when the page opens
    useEffect(() => {
        const loadTrips = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/trips`, {
                    headers: { "ngrok-skip-browser-warning": "true" }
                });

                if (!response.ok) {
                    throw new Error("Failed to load trips");
                }

                const allTrips: Trip[] = await response.json();

                // Filter: Only keep trips that belong to a specific Captain's vessel
                const myTrips = allTrips.filter(
                    (trip) => trip.vesselId === user.vessel?.vessel_id
                );

                // Find the currently active trip only in myTrips
                const runningTrip = myTrips.find(
                    (trip) => trip.status?.toLowerCase() === "active" && trip.endTime === null
                );

                if (runningTrip) {
                    setActiveTrip(runningTrip);
                } else if (myTrips.length > 0) {
                    // If there is no active trip, show the latest trip for current vessel only
                    setActiveTrip(myTrips[myTrips.length - 1]);
                } else {
                    setActiveTrip(null);
                }
            } catch (error) {
                console.error("Error loading trips:", error);
                setMessage("Could not load trips from the server.");
            }
        };
        loadTrips();
        }, [user.vessel?.vessel_id]);


    // ---  GPS TRACKING EFFECT (Noman's code snippet)---
    useEffect(() => {
        let watchId: number;

        if (tripIsActive && user.vessel) {
            if (!navigator.geolocation) {
                setGpsStatus("Error: Your browser does not support GPS tracking.");
                return;
            }

            setGpsStatus("Acquiring GPS Signal...");

            watchId = navigator.geolocation.watchPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setCurrentPos({ lat, lng });

                    try {
                        const responseText = await TrackingClient.pingLocation(user.vessel!.vessel_id!, lat, lng);
                        if (responseText && responseText.includes("WARNING")) {
                            setGpsStatus('🚨 VIOLATION LOGGED!');
                            playAlarmBeep();
                        } else {
                            setGpsStatus(`Streaming Live... (Accuracy: ${Math.round(position.coords.accuracy)}m)`);
                        }
                    } catch (error) {
                        console.error("Backend unreachable", error);
                        setGpsStatus("Warning: Signal lost. Retrying...");
                    }
                },
                (error) => {
                    console.error(error);
                    setGpsStatus(`GPS Error: ${error.message}`);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [tripIsActive, user.vessel, playAlarmBeep]);



    // Start a new trip by sending captainId and vesselId to the backend
    const startTrip = async () => {
        // Prevent starting a trip if a manager hasn't assigned them a ship yet
        if (!user.vessel) {
            setMessage("Error: You must be assigned to a vessel to start a trip.")
            return;
        }
        //  Unlock Audio Context using button click (Noman's code snippet)
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const newCtx = new AudioContextClass();
        newCtx.resume();
        setAudioCtx(newCtx);

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/trips/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({
                    captainId: user.user_id, // Live User Data
                    vesselId: user.vessel.vessel_id, // Live Vessel Data
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to start trip");
            }

            const newTrip: Trip = await response.json();
            setActiveTrip(newTrip);
            setMessage("Trip started successfully.");
        } catch (error) {
            console.error("Error starting trip:", error);
            setMessage("Could not start trip.");
        } finally {
            setLoading(false);
        }
    };

    // End the current trip using tripId
    const endTrip = async () => {
        if (!activeTrip) return;

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/trips/${activeTrip.tripId}/end`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify({
                        status: "completed",
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to end trip");
            }

            const finishedTrip: Trip = await response.json();
            setActiveTrip(finishedTrip);
            setMessage("Trip ended successfully.");

            // Shut down GPS tracking and audio (Noman's code snippet)
            if (audioCtx) {
                audioCtx.close();
                setAudioCtx(null);
            }
            setCurrentPos(null);
            setGpsStatus("Standing By")
        } catch (error) {
            console.error("Error ending trip:", error);
            setMessage("Could not end trip.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="page">
            <h1>Track Trip</h1>
            <p>This page lets the Captain start and end a trip.</p>

            {/* Shows current trip status */}
            <p
                className={
                    "status-pill " +
                    (tripIsActive ? "status-pill--active" : "status-pill--inactive")
                }
            >
                {tripIsActive ? "Trip active" : "No active trip"}
            </p>

            {/* Feedback message */}
            {message && <p>{message}</p>}

            {/* --- LIVE RADAR UI --- */}
            <div style={{
                margin: '20px 0', padding: '20px', borderRadius: '12px', textAlign: 'center',
                backgroundColor: gpsStatus.includes("VIOLATION") ? '#ffebee' : (tripIsActive ? '#e8f5e9' : '#f5f5f5'),
                border: gpsStatus.includes("VIOLATION") ? '2px solid #f44336' : (tripIsActive ? '2px solid #4caf50' : '2px solid #ccc')
            }}>
                <h3 style={{ margin: '0 0 10px 0', color: gpsStatus.includes("VIOLATION") ? '#c62828' : (tripIsActive ? '#2e7d32' : '#666') }}>
                    {gpsStatus}
                </h3>

                {currentPos ? (
                    <p style={{ fontFamily: 'monospace', fontSize: '18px', margin: 0 }}>
                        {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
                    </p>
                ) : (
                    <p style={{ fontFamily: 'monospace', fontSize: '18px', margin: 0 }}>--.------, --.------</p>
                )}
            </div>

            <div className="card">
                <h2>Current Trip</h2>

                {activeTrip ? (
                    <>
                        <p>
                            <strong>Trip ID:</strong> {activeTrip.tripId}
                        </p>
                        <p>
                            <strong>Captain ID:</strong> {activeTrip.captainId}
                        </p>
                        <p>
                            <strong>Vessel ID:</strong> {activeTrip.vesselId}
                        </p>
                        <p>
                            <strong>Started:</strong> {activeTrip.startTime}
                        </p>
                        <p>
                            <strong>Ended:</strong>{" "}
                            {activeTrip.endTime ? activeTrip.endTime : "Trip still active"}
                        </p>
                        <p>
                            <strong>Status:</strong> {activeTrip.status}
                        </p>
                    </>
                ) : (
                    <p>No trip found.</p>
                )}

                <div className="button-row">
                    <button onClick={startTrip} disabled={loading || tripIsActive}>
                        {loading ? "Please wait..." : "Start Trip"}
                    </button>

                    <button onClick={endTrip} disabled={loading || !tripIsActive}>
                        {loading ? "Please wait..." : "End Trip"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TrackTrip;