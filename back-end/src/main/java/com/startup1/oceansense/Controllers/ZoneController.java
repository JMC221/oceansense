package com.startup1.oceansense.Controllers;

import com.startup1.oceansense.DTOs.ZoneDTO;
import com.startup1.oceansense.Models.Zone;
import com.startup1.oceansense.Services.ZoneService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final ZoneService zoneService;

    // Service layer injection
    public ZoneController(ZoneService zoneService) {
        this.zoneService = zoneService;
    }

    // Read all existing zones
    @GetMapping
    public ResponseEntity<List<ZoneDTO>> getAllZones() {
        return ResponseEntity.ok(zoneService.getAllZones());
    }

    // Test endpoint for Task 308-1
    // Sample URL: http://localhost:8080/api/zones/test-check?lng=-0.5&lat=52.5
    @GetMapping("/test-check")
    public String testCompliance(@RequestParam Long vesselId, @RequestParam Double lng, @RequestParam Double lat) {
        zoneService.checkCompliance(vesselId, lng, lat);
        return "Check triggered for Lng: " + lng + ", Lat: " + lat + ". Check your console for alerts!";
    }

    // Create a new zone
    @PostMapping
    public ResponseEntity<?> createZone(@RequestBody ZoneDTO newZoneDTO) {
        try {
            Zone savedZone = zoneService.createZone(newZoneDTO);
            return ResponseEntity.ok(zoneService.convertToDTO(savedZone));
        } catch (IllegalArgumentException e) {
            // if service throws a duplicate error
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Update an existing zone
    @PutMapping("/{id}")
    public ResponseEntity<ZoneDTO> updateZone(@PathVariable Long id, @RequestBody ZoneDTO updatedZoneDTO) {
        try {
            Zone savedZone = zoneService.updateZone(id, updatedZoneDTO);
            return ResponseEntity.ok(zoneService.convertToDTO(savedZone));
        } catch (IllegalArgumentException e) {
            // Send 400 error if ID doesn't exist
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            // Return 500 error
            return ResponseEntity.internalServerError().build();
        }
    }

    // Delete a existing zone
    @DeleteMapping("/{id}")
    public String deleteZone(@PathVariable Long id) {
        boolean deleted = zoneService.deleteZone(id);
        if (deleted) {
            return "Zone " + id + " has been deleted";
        } else {
            return "Error: Zone " + id + " does not exist";
        }
    }



}
