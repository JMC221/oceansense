// src/modules/captain/captainQuota.tsx
import { useState, useEffect } from "react";
import "./captainQuota.css";
import type { User } from "../../App";

interface CaptainQuotaProps {
    user: User;
}

const CaptainQuota = ({ user }: CaptainQuotaProps) => {
    const [quotas, setQuotas] = useState<any[]>([]);
    const [fishTypes, setFishTypes] = useState<any[]>([]);
    const [logEntries, setLogEntries] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const BASE_URL = "/";

    useEffect(() => {
        // First, get the current user's backend ID by matching email
        fetch(`${BASE_URL}/api/users`)
            .then(res => res.json())
            .then(users => {
                const backendUser = users.find((u: any) =>
                    u.email === user.email
                );
                if (backendUser) {
                    setCurrentUserId(backendUser.user_id);
                }
            })
            .catch(err => console.error("Error fetching users:", err));
    }, [user.email]);

    useEffect(() => {
        if (!currentUserId) return;

        // Fetch all quotas
        fetch(`${BASE_URL}/api/v1/quota/quotas`)
            .then(res => res.json())
            .then(data => {
                // Filter quotas to only show current captain's quotas
                const captainQuotas = data.filter((quota: any) =>
                    String(quota.userId) === String(currentUserId)
                );
                setQuotas(captainQuotas);
            })
            .catch(err => console.error("Error fetching quotas:", err));

        // Fetch fish types for species names
        fetch(`${BASE_URL}/fish-types`)
            .then(res => res.json())
            .then(data => setFishTypes(data))
            .catch(err => console.error("Error fetching fish types:", err));

        // Fetch catch summary for status calculations
        fetch(`${BASE_URL}/api/v1/quota/catch-summary`)
            .then(res => res.json())
            .then(data => setLogEntries(data))
            .catch(err => console.error("Error fetching catch summary:", err));
    }, [currentUserId]);

    const calculateQuotaStatus = (quota: any) => {
        const now = new Date();

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

    return (
        <main className="captain-quota-main">
            <div className="captain-quota-header">
                <h1>My Quotas</h1>
                <p>View your personal catch limits and current status</p>
            </div>

            {/* Quotas Grid / Cards - READ ONLY */}
            <div className="quotas-grid">
                {quotas.length === 0 ? (
                    <div className="empty-state">
                        <p>No quotas assigned to you yet.</p>
                        <p>Please contact your manager to set up your fishing quotas.</p>
                    </div>
                ) : (
                    quotas.map((quota: any) => {
                        const { status, totalWeight, remaining } = calculateQuotaStatus(quota);

                        return (
                            <div key={quota.quotaId} className="quota-item-card">
                                <div className="quota-item-header">
                                    <h4>{quota.fishName}</h4>
                                    <span className={`badge badge-${quota.frequency.toLowerCase()}`}>
                                        {quota.frequency}
                                    </span>
                                </div>

                                <div className="quota-details">
                                    <p><strong>Limit:</strong> <span className="weight-highlight">{parseFloat(quota.weightLimitKg).toLocaleString()} kg</span></p>
                                    <p><strong>Caught:</strong> <span className="weight-highlight">{totalWeight.toLocaleString()} kg</span></p>
                                    <p><strong>Remaining:</strong> <span className="weight-highlight">{remaining.toLocaleString()} kg</span></p>
                                </div>

                                <div className={`quota-status status-${status.toLowerCase()}`}>
                                    {status === "EXCEEDED" && "⚠️ Quota Exceeded"}
                                    {status === "WARNING" && "⚠️ Approaching Limit"}
                                    {status === "ON_TRACK" && "✅ On Track"}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
};

export default CaptainQuota;
