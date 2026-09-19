import { useEffect, useState } from "react";
import type { User } from "../../App";

// the Trip entity from the backend
type Trip = {
    tripId: number;
    captainId: number;
    vesselId: number;
    startTime: string;
    endTime: string | null;
    status: string;
};

//  the LogEntry entity from the backend
type LogEntry = {
    logId: number;
    tripId: number;
    vesselId: number;
    fishId: number;
    commonName: string;
    weightKg: number | null;
    quantity: number | null;
    logType: string;
    zoneId: number | null;
};

// the request body sent to the backend
type LogForm = {
    tripId: number | null;
    vesselId: number | null;
    fishId: number;
    commonName: string;
    weightKg: string;
    quantity: string;
    logType: string;
    zoneId: number | null;
};

const API_BASE_URL = "/api";

// Temporary fixed values based on schema seed data
const DEFAULT_FISH_ID = 1;

function Logbook( { user }: { user: User}) {
    // Empty form used when creating a new entry
    const emptyForm: LogForm = {
        tripId: null,
        vesselId: user.vessel?.vessel_id || null,
        fishId: DEFAULT_FISH_ID,
        commonName: "",
        weightKg: "",
        quantity: "",
        logType: "Catch",
        zoneId: null,
    };

    const [form, setForm] = useState<LogForm>(emptyForm);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Load all log entries from the backend
    const loadLogs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/logbook`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch log entries");
            }

            const data: LogEntry[] = await response.json();
            // Filter logs so the Captain only sees their own vessel logs
            const myLogs = data.filter((log: any) => {
                const backendVesselId = log.vesselId || log.vessel_id || (log.vessel && log.vessel.vessel_id);
                return Number(backendVesselId) === Number(user.vessel?.vessel_id);
            });
            setLogs(myLogs);
        } catch (error) {
            console.error("Error loading logbook entries:", error);
            setMessage("Could not load logbook entries.");
        }
    };

    // Load trips so we can find the current active trip
    const loadActiveTrip = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/trips`, {
                headers: { "ngrok-skip-browser-warning": "true" }
            });

            if (!response.ok) {
                throw new Error("Failed to load trips");
            }

            const trips: Trip[] = await response.json();

            const runningTrip = trips.find(
                (trip) => trip.status?.toLowerCase() === "active" && trip.endTime === null &&
                    trip.vesselId === user.vessel?.vessel_id
            );

            if (runningTrip) {
                setActiveTrip(runningTrip);

                // Fill tripId and vesselId automatically for new entries
                setForm((previousForm) => ({
                    ...previousForm,
                    tripId: runningTrip.tripId,
                    vesselId: runningTrip.vesselId,
                }));
            } else {
                setActiveTrip(null);
            }
        } catch (error) {
            console.error("Error loading active trip:", error);
        }
    };

    useEffect(() => {
        loadLogs();
        loadActiveTrip();
    }, []);

    // Update form state when the user types into inputs
    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));
    };

    // Handles both create and update
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        // When creating a new entry, require an active trip
        if (editingId === null && !activeTrip) {
            setMessage("Please start a trip before adding a log entry.");
            setLoading(false);
            return;
        }

        // Build request body in the format that matches Java DTO
        const requestBody = {
            tripId: editingId !== null ? form.tripId : activeTrip?.tripId ?? null,
            vesselId: editingId !== null ? form.vesselId : activeTrip?.vesselId ?? user.vessel?.vessel_id,
            fishId: form.fishId,
            commonName: form.commonName,
            weightKg: form.weightKg === "" ? null : Number(form.weightKg),
            quantity: form.quantity === "" ? null : Number(form.quantity),
            logType: form.logType,
            zoneId: form.zoneId,
        };

        try {
            let response: Response;

            if (editingId !== null) {
                // Update an existing log entry
                response = await fetch(`${API_BASE_URL}/logbook/${editingId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true"
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    throw new Error("Failed to update log entry");
                }

                setMessage("Log entry updated successfully.");
            } else {
                // Create a new log entry
                response = await fetch(`${API_BASE_URL}/logbook`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true"
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    throw new Error("Failed to create log entry");
                }

                setMessage("Log entry added successfully.");
            }

            // Reset form after saving
            setForm({
                ...emptyForm,
                tripId: activeTrip?.tripId ?? null,
            });

            setEditingId(null);
            await loadLogs();
        } catch (error) {
            console.error("Error saving log entry:", error);
            setMessage("Could not save log entry.");
        } finally {
            setLoading(false);
        }
    };

    // Load selected log data into the form for editing
    const handleEdit = (log: LogEntry) => {
        setForm({
            tripId: log.tripId,
            vesselId: log.vesselId,
            fishId: log.fishId,
            commonName: log.commonName,
            weightKg: log.weightKg !== null ? String(log.weightKg) : "",
            quantity: log.quantity !== null ? String(log.quantity) : "",
            logType: log.logType,
            zoneId: log.zoneId,
        });

        setEditingId(log.logId);
        setMessage("");
    };

    // Delete a log entry
    const handleDelete = async (logId: number) => {
        const confirmed = window.confirm("Are you sure you want to delete this entry?");
        if (!confirmed) return;

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/logbook/${logId}`, {
                method: "DELETE",
                headers: { "ngrok-skip-browser-warning": "true" }
            });

            if (!response.ok) {
                throw new Error("Failed to delete log entry");
            }

            setMessage("Log entry deleted successfully.");
            await loadLogs();
        } catch (error) {
            console.error("Error deleting log entry:", error);
            setMessage("Could not delete log entry.");
        } finally {
            setLoading(false);
        }
    };

    // Cancel editing and return to create mode
    const handleCancelEdit = () => {
        setForm({
            ...emptyForm,
            tripId: activeTrip?.tripId ?? null,
        });

        setEditingId(null);
        setMessage("");
    };

    // Prevent crash if Captain has no vessel assigned
    if (!user.vessel) {
        return (
            <div className="page" style={{ padding: '20px' }}>
                <h2>No Vessel Assigned</h2>
                <p>You must be assigned to a vessel by a Manager to use the Logbook.</p>
            </div>
        );
    }

    return (
        <div className="page">
            <h1>Logbook</h1>
            <p>
                This page lets the Captain add, view, edit and delete catch and
                bycatch log entries.
            </p>

            {activeTrip ? (
                <p>
                    Active trip found: <strong>{activeTrip.tripId}</strong>
                </p>
            ) : (
                <p>No active trip found. Start a trip before adding a new log entry.</p>
            )}

            {message && <p>{message}</p>}

            <div className="layout-two-col">
                <div className="card">
                    <h2>{editingId !== null ? "Edit Log Entry" : "New Log Entry"}</h2>

                    <form className="form" onSubmit={handleSubmit}>
                        <label>
                            Log Type
                            <select
                                name="logType"
                                value={form.logType}
                                onChange={handleChange}
                            >
                                <option value="Catch">Catch</option>
                                <option value="Bycatch">Bycatch</option>
                            </select>
                        </label>

                        <label>
                            Species / Common Name
                            <input
                                name="commonName"
                                value={form.commonName}
                                onChange={handleChange}
                                placeholder="e.g. Tuna, Shark, Turtle"
                                required
                            />
                        </label>

                        <label>
                            Weight (kg)
                            <input
                                name="weightKg"
                                type="number"
                                value={form.weightKg}
                                onChange={handleChange}
                                placeholder="e.g. 12.5"
                                step="0.01"
                            />
                        </label>

                        <label>
                            Quantity
                            <input
                                name="quantity"
                                type="number"
                                value={form.quantity}
                                onChange={handleChange}
                                placeholder="e.g. 3"
                            />
                        </label>

                        <div className="button-row">
                            <button type="submit" disabled={loading}>
                                {loading
                                    ? "Please wait..."
                                    : editingId !== null
                                    ? "Update entry"
                                    : "Add entry"}
                            </button>

                            {editingId !== null && (
                                <button type="button" onClick={handleCancelEdit}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="card">
                    <h2>Trip Log Entries</h2>

                    {logs.length === 0 ? (
                        <p>No entries yet.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Log ID</th>
                                    <th>Trip ID</th>
                                    <th>Type</th>
                                    <th>Common Name</th>
                                    <th>Weight (kg)</th>
                                    <th>Quantity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.logId}>
                                        <td>{log.logId}</td>
                                        <td>{log.tripId}</td>
                                        <td>{log.logType}</td>
                                        <td>{log.commonName}</td>
                                        <td>{log.weightKg ?? "-"}</td>
                                        <td>{log.quantity ?? "-"}</td>
                                        <td className="table-actions">
                                            <button type="button" onClick={() => handleEdit(log)}>
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(log.logId)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Logbook;