package com.startup1.oceansense.Models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.locationtech.jts.io.geojson.GeoJsonWriter;
import tools.jackson.databind.JsonNode;

@Entity
// Task 302-1: Create zones table with PostGIS geometry columns
@Table(name = "zones") // Link this class to corresponding table inside DB
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "zone_id")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY) // id not to be modified
    private Long id;
    private String name;
    private String color;

    // PostGIS column
    @Column(columnDefinition = "geometry(Polygon, 4326)")
    private Geometry coordinates;

    // Converts Geometry into Standard GeoJSON strings
    @JsonProperty("coordinates")
    public String getCoordinatesAsGeoJson() {
        if (coordinates == null) return null;
        return new GeoJsonWriter().write(coordinates);
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getColor() { return color; }
    public Geometry getCoordinates() { return coordinates; }

    // Setters
    public void setName(String name) { this.name = name; }
    public void setColor(String color) { this.color = color; }
    public void setCoordinates(Geometry coordinates) { this.coordinates = coordinates; }

    // Task 301-2: Setter to handle incoming GeoJSON from Managers (zones)
    @JsonProperty("coordinates")
    // Replacing String for JsonNode for cleaner API POST body
    public void setCoordinatesFromGeoJson(JsonNode geoJsonNode) {
        try {
            if (geoJsonNode != null && !geoJsonNode.isEmpty()) {
                this.coordinates = new GeoJsonReader().read(geoJsonNode.toString());
            }
        } catch (Exception e) {
            // log if Manager sends bad data
            System.err.println("Error parsing GeoJSON: " + e.getMessage());
        }
    }
}
