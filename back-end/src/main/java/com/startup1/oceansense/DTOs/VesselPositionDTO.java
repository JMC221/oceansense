package com.startup1.oceansense.DTOs;

import java.time.LocalDateTime;

public class VesselPositionDTO {
    private Long id;
    private Long vesselId;
    private Double longitude;
    private Double latitude;
    private LocalDateTime timestamp;
    private String status;

    // Getters
    public Long getId() { return id; }
    public Long getVesselId() { return vesselId; }
    public Double getLongitude() { return longitude; }
    public Double getLatitude() { return latitude; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getStatus() { return status; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setVesselId(Long vesselId) { this.vesselId = vesselId; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public void setStatus(String status) { this.status = status; }
}
