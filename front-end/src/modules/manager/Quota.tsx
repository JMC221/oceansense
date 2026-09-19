// src/modules/manager/Quota.tsx (originally jsx file)
import { useState, useEffect } from "react";
import "./Quota.css";

const Quota = () => {

    const [quotas, setQuotas] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [fishTypes, setFishTypes] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<any>(null);
    const [logEntries, setLogEntries] = useState<any[]>([]);

    const [tempQuota, setTempQuota] = useState({
        userId: "",
        fishId: "",
        weightLimit: "",
        frequency: "Daily",
    });

    const frequencies = ["Daily", "Weekly"];
    const BASE_URL = "";

    useEffect(() => {
        fetch(`${BASE_URL}/api/v1/quota/quotas`)
        .then(res => res.json())
        .then(data => setQuotas(data))
        .catch(err => console.error("Error fetching quotas:", err));

        fetch(`${BASE_URL}/fish-types`)
        .then(res => res.json())
        .then(data => setFishTypes(data))
        .catch(err => console.error("Error fetching fish types:", err));

        fetch(`${BASE_URL}/api/users`)
        .then(res => res.json())
        .then(data => {
            setUsers(data);
            console.log("Users data:", data);
        })
        .catch(err => console.error("Error fetching users:", err));

        fetch(`${BASE_URL}/api/v1/quota/catch-summary`)
        .then(res => res.json())
        .then(data => setLogEntries(data))
        .catch(err => console.error("Error fetching catch summary:", err));
    }, []);


    const calculateQuotaStatus = (quota: any) => {

        const now = new Date(); // Use fixed date for testing

        const relevantEntries = logEntries.filter(entry => {
            if (String(entry.userId) !== String(quota.userId) || String(entry.fishID) !== String(quota.fishId)) {
                return false;
            }

            const entryDate = new Date(entry.date);

            if (quota.frequency === "Daily") {
                return entryDate.toDateString() === now.toDateString();
            } else if (quota.frequency === "Weekly") {
                const startOfWeek = new Date(now);
                startOfWeek.setHours(0, 0, 0, 0);
                startOfWeek.setDate(now.getDate());

                const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)

                const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek;
                startOfWeek.setDate(now.getDate() - daysToSubtract);
                console.log("Start of week:", startOfWeek);
                console.log("Entry date:", entryDate);
                console.log("Is in range:", entryDate >= startOfWeek && entryDate <= now);
                return entryDate >= startOfWeek && entryDate <= now;
            }
            return true;
        });

        const totalWeight = relevantEntries.reduce((sum: number, e: any) => sum + e.totalWeightKg, 0);
        const limit = parseFloat(quota.weightLimitKg);
        const remaining = limit - totalWeight;

        let status = "ON_TRACK";
        if (totalWeight >= limit) status = "EXCEEDED";
        else if (totalWeight >= 0.8 * limit) status = "WARNING";

        return { status, totalWeight, remaining };
    };

    const handleSave = () => {

        const weight = parseFloat(tempQuota.weightLimit);

        if (!tempQuota.weightLimit || isNaN(weight) || weight <= 0) {
            alert("Please enter a weight limit greater than 0 kg (e.g. 0.1, 50, 1000)");
            return;
        }

        if (!tempQuota.userId || !tempQuota.fishId || !tempQuota.weightLimit) {
            alert("Please fill all fields");
            return;
        }

        if (editingId !== null) {
           fetch(`${BASE_URL}/api/v1/quota/update/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user: { user_id : parseInt(tempQuota.userId) },
                fishType: { fish_id: parseInt(tempQuota.fishId) },
                weightLimitKg: tempQuota.weightLimit,
                frequency: tempQuota.frequency
            })
           })
           .then(res => res.json())
           .then(updatedQuota => {
            setQuotas(quotas.map(q => q.id === editingId ? updatedQuota : q));
            cancel();
           })
            .catch(err => console.error("Error updating quota:", err));
        } else {
            fetch(`${BASE_URL}/api/v1/quota/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user: { user_id : parseInt(tempQuota.userId) },
                    fishType: { fish_id: parseInt(tempQuota.fishId) },
                    weightLimitKg: tempQuota.weightLimit,
                    frequency: tempQuota.frequency
                })
            })
            .then(res => res.json())
            .then(newQuota => {
                setQuotas([...quotas, newQuota]);
                cancel();
            })
            .catch(err => console.error("Error creating quota:", err));
        }

        // setTempQuota({ userId: "", fishId: "", weightLimit: "", frequency: "Daily" });
        // setIsAdding(false);
    };

    const startEdit = (quota:any) => {
        setTempQuota({
            userId: quota.userId,
            fishId: quota.fishId,
            weightLimit: quota.weightLimitKg,
            frequency: quota.frequency
        });
        setEditingId(quota.quotaId);
        setIsAdding(true);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setTempQuota({ userId: "", fishId: "", weightLimit: "", frequency: "Daily" });
    };

    const removeQuota = (quotaId:any) => {
        if (window.confirm("Delete this quota permanently?")) {
            fetch(`${BASE_URL}/api/v1/quota/delete/${quotaId}`, {
                method: "DELETE"
            })
            .then(() => {
                setQuotas(quotas.filter((q) => q.quotaId !== quotaId));
                if (editingId === quotaId) cancel();
            })
            .catch(err => console.error("Error deleting quota:", err));
        }
    };

    return (
        <main className="quota-main">
            <div className="quota-header">
                <h1>Quota Management</h1>
                <p>Set catch limits per fisherman and species</p>
                <button onClick={() => setIsAdding(true)} className="button-primary add-btn">
                    + Add New Quota
                </button>
            </div>

            {isAdding && (
                <div className="quota-inline-form">
                    <h3>{editingId !== null ? "Edit Quota" : "New Quota"}</h3>
                    <div className="inline-fields">
                        <select
                            value={tempQuota.userId}
                            onChange={(e) => setTempQuota({ ...tempQuota, userId: e.target.value })}
                        >
                            <option value="">Select Fisherman</option>
                            {users.map((u: any) => (
                                <option key={u.user_id} value={u.user_id}>
                                    {u.first_name} {u.last_name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={tempQuota.fishId}
                            onChange={(e) => setTempQuota({ ...tempQuota, fishId: e.target.value })}
                        >
                            <option value="">Select Species</option>
                            {fishTypes.map((f: any) => (
                                <option key={f.fish_id} value={f.fish_id}>
                                    {f.fishName}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            min="1"
                            placeholder="Weight limit (kg)"
                            value={tempQuota.weightLimit}
                            onChange={(e) => setTempQuota({ ...tempQuota, weightLimit: e.target.value })}
                        />

                        <select
                            value={tempQuota.frequency}
                            onChange={(e) => setTempQuota({ ...tempQuota, frequency: e.target.value })}
                        >
                            {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>

                    <div className="inline-actions">
                        <button onClick={handleSave} className="button-primary">
                            {editingId !== null ? "Update" : "Save"}
                        </button>
                        <button onClick={cancel} className="button-cancel">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="quotas-grid">
                {quotas.length === 0 && !isAdding ? (
                    <div className="empty-state">
                        <p>No quotas defined yet.</p>
                        <p>Click "Add New Quota" to get started.</p>
                    </div>
                ) : (
                    quotas.map((quota: any) => {
                        const user = users.find((u: any) => String(u.user_id) === String(quota.userId)) as any;
                        const { status, totalWeight, remaining } = calculateQuotaStatus(quota);

                        return (
                            <div key={quota.quotaId} className="quota-item-card">
                                <div className="quota-item-header">
                                    <h4>{user ? `${user.first_name} ${user.last_name}` : `User ID: ${quota.userId}`}</h4>
                                    <span className={`badge badge-${quota.frequency.toLowerCase()}`}>
                                        {quota.frequency}
                                    </span>
                                </div>

                                <div className="quota-details">
                                    <p><strong>Species:</strong> {quota.fishName}</p>
                                    <p><strong>Limit:</strong> <span className="weight-highlight">{parseFloat(quota.weightLimitKg).toLocaleString()} kg</span></p>
                                    <p><strong>Caught:</strong> {totalWeight.toLocaleString()} kg</p>
                                    <p><strong>Remaining:</strong> {remaining.toLocaleString()} kg</p>
                                </div>

                                <div className={`quota-status status-${status.toLowerCase()}`}>
                                    {status === "EXCEEDED" && "⚠️ Quota Exceeded"}
                                    {status === "WARNING" && "⚠️ Approaching Limit"}
                                    {status === "ON_TRACK" && "✅ On Track"}
                                </div>

                                <div className="quota-item-actions">
                                    <button onClick={() => startEdit(quota)} className="button-edit">Edit</button>
                                    <button onClick={() => removeQuota(quota.quotaId)} className="button-delete">Delete</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
};

export default Quota;