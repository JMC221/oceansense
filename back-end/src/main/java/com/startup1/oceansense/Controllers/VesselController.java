package com.startup1.oceansense.Controllers;

import com.startup1.oceansense.Models.Vessel;
import com.startup1.oceansense.Services.VesselService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vessels")
@CrossOrigin(origins = "*") // Allow requests from the Vite React dev server
public class VesselController {

    private final VesselService vesselService;

    public VesselController(VesselService vesselService) {
        this.vesselService = vesselService;
    }

    // GET /api/vessels  — returns all vessels
    @GetMapping
    public List<Vessel> getAllVessels() {
        return vesselService.getAllVessels();
    }

    // GET /api/vessels/{id}  — returns one vessel by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getVesselById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(vesselService.getVesselById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // POST /api/vessels  — create a new vessel
    @PostMapping
    public ResponseEntity<?> createVessel(@RequestBody Vessel vessel) {
        try {
            Vessel created = vesselService.createVessel(vessel);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/vessels/{id}  — update an existing vessel
    @PutMapping("/{id}")
    public ResponseEntity<?> updateVessel(@PathVariable Integer id, @RequestBody Vessel updatedVessel) {
        try {
            Vessel updated = vesselService.updateVessel(id, updatedVessel);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/vessels/{id}  — delete a vessel
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVessel(@PathVariable Integer id) {
        try {
            vesselService.deleteVessel(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}