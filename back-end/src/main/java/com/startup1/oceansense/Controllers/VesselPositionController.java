package com.startup1.oceansense.Controllers;

import com.startup1.oceansense.DTOs.VesselPositionDTO;
import com.startup1.oceansense.Services.VesselPositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vessel-positions")
public class VesselPositionController {

    private final VesselPositionService vesselPositionService;
    // Constructor
    public VesselPositionController(VesselPositionService vesselPositionService) {
        this.vesselPositionService = vesselPositionService;
    }

    @GetMapping("/latest")
    public ResponseEntity<List<VesselPositionDTO>> getLatestPositions() {
        return ResponseEntity.ok(vesselPositionService.getAllLatestPositions());
    }

    // Get history of specific vessel
    @GetMapping("/history/{vesselId}")
    public ResponseEntity<List<VesselPositionDTO>> getVesselHistory(@PathVariable Long vesselId) {
        List<VesselPositionDTO> history = vesselPositionService.getVesselHistory(vesselId);

        if (history.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(history);
    }

    // Task 306-2: Ping endpoint for Captain's GPS device
    // Logs the movement and immediately checks for zone violations
    @PostMapping("/ping")
    public ResponseEntity<Map<String, String>> receivePing (@RequestBody VesselPositionDTO positionDTO) {

        // Task 308-1: Server-side Point-in-Polygon log and compliance check
        // Check if captain is violating
        boolean isViolating = vesselPositionService.processNewPing(positionDTO);

        // Build a JSON response for the frontend
        Map<String, String> response = new HashMap<>();

        if (isViolating) {
            response.put("status", "VIOLATION");
            response.put("message", "WARNING: You have entered a restricted zone!");
        } else {
            response.put("status", "SAFE");
            response.put("message", "Position logged safely.");
        }
        return ResponseEntity.ok(response);
    }

}
