package com.startup1.oceansense.Repositories;

import com.startup1.oceansense.Models.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

//Repository = DB access for trips table.
 // Spring will generate SQL automatically for CRUD
public interface TripRepository extends JpaRepository<Trip, Long> {
    // Method looks for a trip matching the Vessel ID where the end time is still NULL
    Optional<Trip> findFirstByVesselIdAndEndTimeIsNullOrderByStartTimeDesc(Long vesselId);
}