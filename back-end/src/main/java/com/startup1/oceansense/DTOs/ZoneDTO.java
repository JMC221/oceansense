package com.startup1.oceansense.DTOs;

import com.fasterxml.jackson.annotation.JsonRawValue;

public class ZoneDTO {
    private Long id;
    private String name;
    private String color;

    // Deliver clean output
    @JsonRawValue
    private String coordinates;

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getColor() { return color; }
    public String getCoordinates() { return coordinates; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setColor(String color) { this.color = color; }
    public void setCoordinates(String coordinates) { this.coordinates = coordinates; }
}
