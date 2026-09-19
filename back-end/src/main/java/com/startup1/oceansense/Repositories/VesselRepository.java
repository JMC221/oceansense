package com.startup1.oceansense.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.startup1.oceansense.Models.Vessel;

public interface VesselRepository extends JpaRepository<Vessel, Integer> {

    // Reminder to myself:
    // Spring Data JPA lets me define methods by naming convention.
    // This means I get SQL queries automatically without writing them.

    boolean existsByVesselNameIgnoreCase(String vesselName);
}