package com.startup1.oceansense.Controllers;

import com.startup1.oceansense.DTOs.AlertDTO;
import com.startup1.oceansense.Services.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    // Get all alerts for the Managers
    @GetMapping("/all")
    public ResponseEntity<List<AlertDTO>> getAllAlerts() {
       return ResponseEntity.ok(alertService.getAllAlerts());
    }

    // Get all active alerts for Manager
    @GetMapping("/active")
    public ResponseEntity<List<AlertDTO>> getActiveAlerts() {
        return ResponseEntity.ok(alertService.getActiveAlerts());
    }

    // Manager clicks "resolve" button on the UI
    @PatchMapping("/{id}/resolve")
    public ResponseEntity<?> resolveAlert(@PathVariable Long id) {
        try {
            AlertDTO resolvedAlert = alertService.resolveAlert(id);
            return ResponseEntity.ok(resolvedAlert);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
