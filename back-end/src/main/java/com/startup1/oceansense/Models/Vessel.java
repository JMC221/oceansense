package com.startup1.oceansense.Models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity // Maps this class to the "vessels" table
@Table(
        name = "vessels",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_vessel_name",
                columnNames = "vessel_name"
        )
)
public class Vessel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vessel_id")
    @JsonProperty("vessel_id") // JSON key name for frontend
    private Integer vesselId;

    @Column(name = "vessel_name", nullable = false, length = 100, unique = true)
    @JsonProperty("vessel_name")
    private String vesselName;

    // Important: JPA requires a no-arg constructor
    public Vessel() {}

    // Getters/setters
    public Integer getVesselId() {
        return vesselId;
    }

    public void setVesselId(Integer vesselId) {
        this.vesselId = vesselId;
    }

    public String getVesselName() {
        return vesselName;
    }

    public void setVesselName(String vesselName) {
        this.vesselName = vesselName;
    }
}