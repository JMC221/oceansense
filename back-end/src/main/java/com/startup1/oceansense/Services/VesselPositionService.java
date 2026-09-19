package com.startup1.oceansense.Services;

import com.startup1.oceansense.DTOs.VesselPositionDTO;
import com.startup1.oceansense.Models.Trip;
import com.startup1.oceansense.Models.VesselPosition;
import com.startup1.oceansense.Repositories.VesselPositionRepository;
import com.startup1.oceansense.Repositories.TripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class VesselPositionService {

    private final VesselPositionRepository positionRepository;
    private final ZoneService zoneService;
    private final AlertService alertService;
    private final TripRepository tripRepository;

    // Injecting repository for saving and service for math
    public VesselPositionService(VesselPositionRepository positionRepository, ZoneService zoneService, AlertService alertService, TripRepository tripRepository) {
        this.positionRepository = positionRepository;
        this.zoneService = zoneService;
        this.alertService = alertService;
        this.tripRepository = tripRepository;
    }

    @Transactional
    public boolean processNewPing(VesselPositionDTO newPositionDTO) {

        // Auto register the ship if it is new
        positionRepository.createVesselIfNotExists(newPositionDTO.getVesselId());

        boolean isViolating = false;

        // Convert incoming clean DTO into a database Entity
        VesselPosition newPosition = convertToEntity(newPositionDTO);

        // Every new ping has a timestamp
        if (newPosition.getTimestamp() == null) {
            newPosition.setTimestamp(LocalDateTime.now());
        }

        // Fetch the last known position before the new one is saved
        VesselPosition lastPosition = positionRepository.findFirstByVesselIdOrderByTimestampDesc(newPosition.getVesselId()).orElse(null);

        // Fetch the currently active trip
        Optional<Trip> activeTripOpt = tripRepository.findFirstByVesselIdAndEndTimeIsNullOrderByStartTimeDesc(newPosition.getVesselId());

        if (lastPosition != null && lastPosition.getTimestamp() != null && activeTripOpt.isPresent()) {
            Trip activeTrip = activeTripOpt.get();

            // Trip awareness check: Only calculate gaps if the previous ping was also part of current trip
            // using minusMinutes(1) to be safe with start-time precision
            if (lastPosition.getTimestamp().isAfter(activeTrip.getStartTime().minusMinutes(1))) {
                // calcualte the time gap in minutes
                long minutesBetween = Duration.between(lastPosition.getTimestamp(), newPosition.getTimestamp()).toMinutes();

                // Run the math only if the gap is <= 1 minute
                if (minutesBetween <= 1) {
                    boolean crossedZone = zoneService.checkPathCompliance(
                            newPosition.getVesselId(), lastPosition.getLongitude(), lastPosition.getLatitude(),
                            newPosition.getLongitude(), newPosition.getLatitude()
                    );
                    if (crossedZone) isViolating = true;
                } else {
                    // Only triggered if vessel goes dark DURING a trip for > 1 min
                    System.out.println("WARNING: VESSEL " + newPosition.getVesselId() + " went dark for " + minutesBetween + " minutes during trip.");
                    alertService.logEquipmentTampering(newPosition.getVesselId(), minutesBetween);
                }
            } else {
                System.out.println("INFO: First ping of a new trip for Vessel " + newPosition.getVesselId() + ". Ignoring gap from previous session.");
            }
        }

        // Standard Point-in-Polygon check for the current position
        boolean insideZone = zoneService.checkCompliance(newPosition.getVesselId(), newPosition.getLongitude(), newPosition.getLatitude());
        if (insideZone) isViolating = true;

        // Saving GPS position in vessel_positions table
        positionRepository.save(newPosition);
        return isViolating;
    }

    // DTO Mapper
    public VesselPositionDTO convertToDTO(VesselPosition pos) {
        VesselPositionDTO dto = new VesselPositionDTO();
        dto.setId(pos.getId());
        dto.setVesselId(pos.getVesselId());
        dto.setLongitude(pos.getLongitude());
        dto.setLatitude(pos.getLatitude());
        dto.setTimestamp(pos.getTimestamp());
        return dto;
    }

    // Convert brand new record into an Entity and save it to DB
    public VesselPosition convertToEntity(VesselPositionDTO dto) {
        VesselPosition pos = new VesselPosition();
        pos.setVesselId(dto.getVesselId());
        pos.setLongitude(dto.getLongitude());
        pos.setLatitude(dto.getLatitude());
        pos.setTimestamp(dto.getTimestamp());
        return pos;
    }

    public List<VesselPositionDTO> getAllLatestPositions() {
        return positionRepository.findAllLatestPositions().stream().map(pos -> {
            // Convert to DTO
            VesselPositionDTO dto = convertToDTO(pos);

            // Check if the vessel currently has an active trip
            boolean hasActiveTrip = tripRepository.findFirstByVesselIdAndEndTimeIsNullOrderByStartTimeDesc(pos.getVesselId()).isPresent();

            if (!hasActiveTrip) {
                // If the trip is over, flag them as safely docked
                dto.setStatus("DOCKED");
            } else {
                // Perform live Point-in-Polygon check to see if this ship is currently violating
                boolean isViolating = zoneService.checkCompliance(pos.getVesselId(), pos.getLongitude(), pos.getLatitude());
                // Attach the status flag
                dto.setStatus(isViolating ? "VIOLATION" : "SAFE");
            }
            return dto;
        }).toList();
    }

    // Get the trip history of the vessel
    public List<VesselPositionDTO> getVesselHistory(Long vesselId) {
        return positionRepository.findAllByVesselIdOrderByTimestampAsc(vesselId).stream()
                .map(this::convertToDTO).toList();
    }



}
