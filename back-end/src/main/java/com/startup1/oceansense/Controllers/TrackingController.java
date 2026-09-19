package com.startup1.oceansense.Controllers;

import com.startup1.oceansense.DTOs.VesselPositionDTO;
import com.startup1.oceansense.Services.VesselPositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("api/tracking")
public class TrackingController {

    private final VesselPositionService trackingService;

    public TrackingController(VesselPositionService trackingService) {
        this.trackingService = trackingService;
    }

    // Catch the live GPS ping
    @PostMapping("/ping")
    public ResponseEntity<String> receivePing(@RequestBody VesselPositionDTO incomingPing) {
        try {
            // The service does the math, creates alerts and saves the data
            boolean violationTriggered = trackingService.processNewPing(incomingPing);

            if (violationTriggered) {
                return ResponseEntity.ok("Ping received. WARNING: Violation logged.");
            } else {
                return ResponseEntity.ok("Ping received. Vessel is in safe waters.");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing ping: " + e.getMessage());
        }
    }

    // For the Captain's Map: get the latest location of all ships
    @GetMapping("/latest")
    public ResponseEntity<List<VesselPositionDTO>> getLatestPositions() {
        return ResponseEntity.ok(trackingService.getAllLatestPositions());
    }

    // For logbook/ history: get historical breadcrumb trail of a specific ship
    @GetMapping("/history/{vesselId}")
    public ResponseEntity<List<VesselPositionDTO>> getVesselHistory(@PathVariable Long vesselId) {
        return ResponseEntity.ok(trackingService.getVesselHistory(vesselId));
    }
}
