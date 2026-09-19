package com.startup1.oceansense.Models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @Column(name = "vessel_id", nullable = false)
    private Long vesselId;

    @Column(name = "zone_id")
    private Long zoneId;

    @Column(name = "alert_type", nullable = false)
    private String alertType;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime timestamp;

    private Boolean resolved;

    // Set current time and mark as unresolved when alert created
    public Alert() {
        this.timestamp = LocalDateTime.now();
        this.resolved = false;
        this.alertType = "UNKNOWN";
    }

    // Getters
    public Long getId() { return id; }
    public Long getVesselId() { return vesselId; }
    public Long getZoneId() { return zoneId; }
    public String getAlertType() { return alertType; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public Boolean getResolved() { return resolved; }

    // Setters
    public void setVesselId(Long vesselId) { this.vesselId = vesselId; }
    public void setZoneId(Long zoneId) { this.zoneId = zoneId; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public void setResolved(Boolean resolved) { this.resolved = resolved; }

}
