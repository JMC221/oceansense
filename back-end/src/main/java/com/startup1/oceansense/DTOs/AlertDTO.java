package com.startup1.oceansense.DTOs;

import java.time.LocalDateTime;

public class AlertDTO {
    private Long id;
    private Long vesselId;
    private Long zoneId;
    private String alertType;
    private boolean resolved;
    private LocalDateTime timestamp;

    // Getters
    public Long getId() { return id; }
    public Long getVesselId() { return vesselId; }
    public Long getZoneId() { return zoneId; }
    public String getAlertType() { return alertType; }
    public boolean isResolved() { return resolved; }
    public LocalDateTime getTimestamp() { return timestamp; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setVesselId(Long vesselId) { this.vesselId = vesselId; }
    public void setZoneId(Long zoneId) { this.zoneId = zoneId; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
