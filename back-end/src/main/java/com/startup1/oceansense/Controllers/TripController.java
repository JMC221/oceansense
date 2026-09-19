package com.startup1.oceansense.Controllers;

import com.startup1.oceansense.DTOs.EndTripRequest;
import com.startup1.oceansense.DTOs.StartTripRequest;
import com.startup1.oceansense.Models.Trip;
import com.startup1.oceansense.Repositories.TripRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Endpoints for "Track Trip":
 * - Start trip
 * - End trip
 * - View all trips
 */
//adding cors origins because front and backend running on diff ports
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripRepository tripRepository;

    // Constructor injection 
    public TripController(TripRepository tripRepository) {
        this.tripRepository = tripRepository;
    }

    
     //Start a new trip (new row in trips table).
     
    @PostMapping("/start")
    public ResponseEntity<Trip> startTrip(@RequestBody StartTripRequest request) {

        Trip trip = new Trip();
        trip.setCaptainId(request.getCaptainId());
        trip.setVesselId(request.getVesselId());

        // Store current time as start time
        trip.setStartTime(LocalDateTime.now());

        // Default active
        trip.setStatus("active");

        Trip saved = tripRepository.save(trip);
        return ResponseEntity.ok(saved);
    }

    //End a trip (updates end_time and status).
    
    @PutMapping("/{tripId}/end")
     public ResponseEntity<?> endTrip(@PathVariable Long tripId,@RequestBody(required = false) EndTripRequest request) {

    Optional<Trip> tripOptional = tripRepository.findById(tripId);

    if (tripOptional.isEmpty()) {
        return ResponseEntity.status(404).body("Trip not found: " + tripId);
    }

    Trip trip = tripOptional.get();

    // stop ending the same trip twice
    if ("completed".equalsIgnoreCase(trip.getStatus())) {
        return ResponseEntity.badRequest().body("Trip already ended: " + tripId);
    }

    trip.setEndTime(LocalDateTime.now());

    // default status if body not provided
    String newStatus = "completed";
    if (request != null && request.getStatus() != null && !request.getStatus().isBlank()) {
        newStatus = request.getStatus();
    }
    trip.setStatus(newStatus);

    Trip saved = tripRepository.save(trip);
    return ResponseEntity.ok(saved);
}

    
     // View all trips
    @GetMapping
    public ResponseEntity<List<Trip>> getAllTrips() {
        return ResponseEntity.ok(tripRepository.findAll());
    }
}