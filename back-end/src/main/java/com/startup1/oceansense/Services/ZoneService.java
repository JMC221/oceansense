package com.startup1.oceansense.Services;

import com.startup1.oceansense.DTOs.ZoneDTO;
import com.startup1.oceansense.Models.Zone;
import com.startup1.oceansense.Repositories.ZoneRepository;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.locationtech.jts.io.geojson.GeoJsonWriter;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ZoneService {
    private final ZoneRepository zoneRepository;
    private final AlertService alertService;

    // Injection in constructor
    public ZoneService(ZoneRepository zoneRepository, AlertService alertService) {
        this.zoneRepository = zoneRepository;
        this.alertService = alertService;
    }

    // Helper to convert Entity to DTO
    public ZoneDTO convertToDTO(Zone zone) {
        ZoneDTO dto = new ZoneDTO();
        dto.setId(zone.getId());
        dto.setName(zone.getName());
        dto.setColor(zone.getColor());

        // Convert Geometry coordinate into a GeoJSON string
        if (zone.getCoordinates() != null) {
            GeoJsonWriter writer = new GeoJsonWriter();
            writer.setEncodeCRS(false);
            dto.setCoordinates(writer.write(zone.getCoordinates()));
        }
        return dto;
    }
    // Helper to convert DTO to entity (for POST/ PUT methods)
    public Zone convertToEntity(ZoneDTO dto) {
        Zone zone = new Zone();
        zone.setName(dto.getName());
        zone.setColor(dto.getColor());

        try {
            if (dto.getCoordinates() != null) {
                GeoJsonReader reader = new GeoJsonReader();
                Geometry geom = reader.read(dto.getCoordinates());
                geom.setSRID(4326); // Set Standard GPS projection
                zone.setCoordinates(geom);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid GeoJson coordinates provided.");
        }
        return zone;
    }

    // Task 302-2: Implement GET /zones endpoint for map display (READ)
    public List<ZoneDTO> getAllZones() {
        // Fetch raw entities and map them to DTOs before they leave the service
        return zoneRepository.findAllByOrderByIdAsc().stream().map(this::convertToDTO).toList();
    }

    // Task 301-2: CREATE a new zone (Manager CRUD)
    public Zone createZone(ZoneDTO newZoneDTO) {
        // Check for duplicates
        if (zoneRepository.existsByName(newZoneDTO.getName())) {
            throw new IllegalArgumentException("Error: Zone '"+ newZoneDTO.getName() + "' already exists.");
        }
        Zone newZone = convertToEntity(newZoneDTO);
        return zoneRepository.save(newZone);
    }

    // Task 301-2: DELETE a zone (Manager CRUD)
    public boolean deleteZone(Long id) {
        if (zoneRepository.existsById(id)) {
            zoneRepository.deleteById(id);
            return true;
        } else {
            return false;
        }
    }

    // Task 301-2: UPDATE a zone (Manager CRUD)
    public Zone updateZone(Long id, ZoneDTO updatedZoneDTO) {
        // Find the existing zone in the database
        return zoneRepository.findById(id).map(existingZone -> {
            // Convert incoming DTO to entity to parse coordinates
            Zone parsedUpdate = convertToEntity(updatedZoneDTO);

            existingZone.setName(parsedUpdate.getName());
            existingZone.setColor(parsedUpdate.getColor());
            existingZone.setCoordinates(parsedUpdate.getCoordinates());

            // Save it
            return zoneRepository.save(existingZone);
        }).orElseThrow(() -> new IllegalArgumentException("Error: Zone " + id + " does not exist"));
    }

    // Task 308-1: Server-side Point-in-Polygon check to flag illegal entry
    // Reference variable over primitive: double cannot be truly null
    // Check if the single point (coordinate) is inside the zone
    public boolean checkCompliance(Long vesselId, Double lng, Double lat) {
        List<Zone> violatedZones = zoneRepository.findZonesContainingPoint(lng, lat);
        boolean isViolating = false;
        if(!violatedZones.isEmpty()) {
            isViolating = true;
            for (Zone z : violatedZones) {
                System.out.println("ALERT: Vessel " + vesselId + " entered restricted zone: " + z.getName());
                alertService.logViolation(vesselId, z.getId());
            }
        } else {
            System.out.println("Vessel " + vesselId + " is in safe waters.");
        }
        return isViolating;
    }

    // Anti-scammer check: Check if the line between the old and new point cross a zone
    public boolean checkPathCompliance(Long vesselId, Double oldLng, Double oldLat, Double newLng, Double newLat) {
        List<Zone> crossedZones = zoneRepository.findZonesIntersectingPath(oldLng, oldLat, newLng, newLat);

        // Upon violation, this flag will help pass the violation alert to the VesselPositionController
        // via its service later (VesselPositionService)
        boolean isViolating = false;

        if (!crossedZones.isEmpty()) {
            isViolating = true;
            for (Zone z : crossedZones) {
                System.out.println("ALERT: Vessel " + vesselId + " crossed through restricted zone (Path violation): " + z.getName());

                // Alert Service Layer will handle the log
                alertService.logViolation(vesselId, z.getId());
            }
        }
        return isViolating;
    }
}
