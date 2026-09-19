package com.startup1.oceansense.Models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vessel_positions")
public class VesselPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY) // Not allowed to write
    private Long id;

    // Link to vessels table
    @Column(name = "vessel_id")
    private Long vesselId;

    private Double latitude;
    private Double longitude;

    // Tracks when the ship was at a location
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime timestamp;

    public VesselPosition() {
        this.timestamp = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Long getVesselId() { return vesselId; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public LocalDateTime getTimestamp() { return timestamp; }

    // Setters
    public void setVesselId(Long vesselId) { this.vesselId = vesselId; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}



