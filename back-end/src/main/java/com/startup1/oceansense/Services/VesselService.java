package com.startup1.oceansense.Services;

import com.startup1.oceansense.Models.Vessel;
import com.startup1.oceansense.Repositories.VesselRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service // Marks this as a service class (business logic layer)
public class VesselService {

    private final VesselRepository vesselRepository;

    // Constructor injection — cleaner and recommended by Spring docs
    public VesselService(VesselRepository vesselRepository) {
        this.vesselRepository = vesselRepository;
    }

    // Return all vessels
    public List<Vessel> getAllVessels() {
        return vesselRepository.findAll();
    }

    // Find vessel by id or throw error
    public Vessel getVesselById(Integer id) {
        return vesselRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vessel not found"));
    }

    // Create new vessel
    public Vessel createVessel(Vessel vessel) {

        // Reminder: check uniqueness before creating
        if (vesselRepository.existsByVesselNameIgnoreCase(vessel.getVesselName())) {
            throw new RuntimeException("Vessel name already exists");
        }

        return vesselRepository.save(vessel);
    }

    // Update vessel
    public Vessel updateVessel(Integer id, Vessel updatedVessel) {

        // Check if vessel exists
        Vessel existing = vesselRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vessel not found"));

        // If name is changing, check for duplicates
        if (updatedVessel.getVesselName() != null) {
            String newName = updatedVessel.getVesselName();

            // Only check for duplicates if the new name is different
            if (!newName.equalsIgnoreCase(existing.getVesselName())
                    && vesselRepository.existsByVesselNameIgnoreCase(newName)) {
                throw new RuntimeException("Vessel name already exists");
            }

            existing.setVesselName(newName);
        }

        return vesselRepository.save(existing);
    }

    // Delete by ID
    public void deleteVessel(Integer id) {
        if (!vesselRepository.existsById(id)) {
            throw new RuntimeException("Vessel not found");
        }
        vesselRepository.deleteById(id);
    }
}