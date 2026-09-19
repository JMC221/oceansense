package com.startup1.oceansense.Repositories;

import com.startup1.oceansense.Models.VesselPosition;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VesselPositionRepository extends JpaRepository<VesselPosition, Long> {
    // Custom Query: Find the most recent ping for the vessel
    // Optional -> avoid NullPointerException
    // Official doc: Optional is primarily intended for use as a method return type where there is a clear need
    // to represent "no result," and where using null is likely to cause errors

    // The following method is named in such a way, that JPA generates an SQL query using Query derivation
    Optional<VesselPosition> findFirstByVesselIdOrderByTimestampDesc(Long vesselId);

    // Get most recent position of every vessel
    @Query(value = "SELECT DISTINCT ON (vessel_id) * FROM vessel_positions ORDER BY vessel_id, timestamp DESC", nativeQuery = true)
    List<VesselPosition> findAllLatestPositions();

    // Fetch full history for a specific vessel
    List<VesselPosition> findAllByVesselIdOrderByTimestampAsc(Long vesselId);

    @Modifying
    @Transactional
    @Query( value = "INSERT INTO vessels (vessel_id, vessel_name) VALUES (:vesselId, CONCAT('Auto-Registered Ship ', :vesselId))" +
            " ON CONFLICT (vessel_id) DO NOTHING", nativeQuery = true)
    void createVesselIfNotExists(@Param("vesselId") Long vesselId);

}
