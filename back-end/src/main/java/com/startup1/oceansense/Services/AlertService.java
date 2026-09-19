package com.startup1.oceansense.Services;

import com.startup1.oceansense.DTOs.AlertDTO;
import com.startup1.oceansense.Models.Alert;
import com.startup1.oceansense.Repositories.AlertRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlertService {

    private final AlertRepository alertRepository;

    public AlertService(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    // DTO mapper
    public AlertDTO convertToDTO(Alert alert) {
        AlertDTO dto = new AlertDTO();
        dto.setId(alert.getId());
        dto.setVesselId(alert.getVesselId());
        dto.setZoneId(alert.getZoneId());
        dto.setAlertType(alert.getAlertType());
        dto.setResolved(alert.getResolved());
        dto.setTimestamp(alert.getTimestamp());
        return dto;
    }

    // Task 308-1: Create and save a new violation alert
    // Standard trespassing
    public void logViolation(Long vesselId, Long zoneId) {

        // Spam filter
        // If an open ticket already exists for a specific zone in the current zone, do nothing
        if (alertRepository.existsByVesselIdAndZoneIdAndResolvedFalse(vesselId, zoneId)) {
            return;
        }

        // Create Alert record
        Alert violation = new Alert();
        violation.setVesselId(vesselId);
        violation.setZoneId(zoneId);
        violation.setAlertType("ZONE_TRESPASS");
        violation.setResolved(false);
        // Save to Database
        alertRepository.save(violation);
    }
    // GPS malfunction / tampering
    public void logEquipmentTampering(Long vesselId, long minutesDark) {
        // Spam filter
        if (alertRepository.existsByVesselIdAndAlertTypeAndResolvedFalse(vesselId, "SIGNAL_LOST_" + minutesDark + "_MINS")) {
            return;
        }
        Alert tampering = new Alert();
        tampering.setVesselId(vesselId);
        tampering.setZoneId(null);
        tampering.setAlertType("SIGNAL_LOST_" + minutesDark + "_MINS");
        tampering.setResolved(false);
        // Save to database
        alertRepository.save(tampering);
    }

    // Fetch all alerts for frontend
    public List<AlertDTO> getAllAlerts() {
        return alertRepository.findAll().stream().map(this::convertToDTO).toList();
    }

    // Fetch only Active alerts for frontend
    public List<AlertDTO> getActiveAlerts() {
        return alertRepository.findAllByResolvedFalseOrderByTimestampDesc().stream().map(this::convertToDTO)
                .toList();
    }

    // Resolve alerts
    public AlertDTO resolveAlert(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Error: Alert " + id + " does not exist. "));
        alert.setResolved(true);
        Alert savedAlert = alertRepository.save(alert);
        return convertToDTO(savedAlert);
    }


}
