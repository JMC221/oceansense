package com.startup1.oceansense.Controllers;

import com.startup1.oceansense.DTOs.LogEntryRequest;
import com.startup1.oceansense.Models.LogEntry;
import com.startup1.oceansense.Repositories.LogEntryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Logbook CRUD endpoints:
 * - Create a log entry
 * - Get log entries 
 * - Update log entry
 * - Delete log entry
 */
//enabling Cors because front and backend running on diff ports
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/logbook")
public class LogbookController {

    private final LogEntryRepository logEntryRepository;

    public LogbookController(LogEntryRepository logEntryRepository) {
        this.logEntryRepository = logEntryRepository;
    }

    //CREATE log entry

    @PostMapping
    public ResponseEntity<LogEntry> createLog(@RequestBody LogEntryRequest request) {

        LogEntry entry = new LogEntry();
        entry.setTripId(request.getTripId());
        entry.setVesselId(request.getVesselId());
        entry.setFishId(request.getFishId());
        entry.setCommonName(request.getCommonName());
        entry.setWeightKg(request.getWeightKg());
        entry.setQuantity(request.getQuantity());
        entry.setLogType(request.getLogType());
        entry.setZoneId(request.getZoneId());

        LogEntry saved = logEntryRepository.save(entry);
        return ResponseEntity.status(201).body(saved);
    }

    
     //READ all log entries OR logs for one trip
    @GetMapping
    public ResponseEntity<List<LogEntry>> getLogs(@RequestParam(required = false) Long tripId) {

        if (tripId != null) {
            return ResponseEntity.ok(logEntryRepository.findByTripId(tripId));
        }

        return ResponseEntity.ok(logEntryRepository.findAll());
    }

    
     //READ one entry by ID
     
    @GetMapping("/{logId}")
    public ResponseEntity<?> getLogById(@PathVariable Long logId) {

        Optional<LogEntry> entryOptional = logEntryRepository.findById(logId);

        if (entryOptional.isEmpty()) {
            return ResponseEntity.status(404).body("Log entry not found: " + logId);
        }

        return ResponseEntity.ok(entryOptional.get());
    }

    
     //UPDATE an entry by ID
     
    @PutMapping("/{logId}")
    public ResponseEntity<?> updateLog(@PathVariable Long logId, @RequestBody LogEntryRequest request) {

        Optional<LogEntry> entryOptional = logEntryRepository.findById(logId);

        if (entryOptional.isEmpty()) {
            return ResponseEntity.status(404).body("Log entry not found: " + logId);
        }

        LogEntry entry = entryOptional.get();
        entry.setTripId(request.getTripId());
        entry.setVesselId(request.getVesselId());
        entry.setFishId(request.getFishId());
        entry.setCommonName(request.getCommonName());
        entry.setWeightKg(request.getWeightKg());
        entry.setQuantity(request.getQuantity());
        entry.setLogType(request.getLogType());
        entry.setZoneId(request.getZoneId());

        LogEntry saved = logEntryRepository.save(entry);
        return ResponseEntity.ok(saved);
    }

    
     //DELETE an entry by ID
     
    @DeleteMapping("/{logId}")
    public ResponseEntity<?> deleteLog(@PathVariable Long logId) {

        if (!logEntryRepository.existsById(logId)) {
            return ResponseEntity.status(404).body("Log entry not found: " + logId);
        }

        logEntryRepository.deleteById(logId);
        return ResponseEntity.ok("Deleted log entry: " + logId);
    }
}