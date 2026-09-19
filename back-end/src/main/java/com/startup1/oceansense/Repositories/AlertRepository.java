package com.startup1.oceansense.Repositories;

import com.startup1.oceansense.Models.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    // Fetch only alerts that are still active/ unresolved
    List<Alert> findAllByResolvedFalseOrderByTimestampDesc();

    // Spam filter for Zone violations (Uses Long zoneId)
    boolean existsByVesselIdAndZoneIdAndResolvedFalse(Long vesselId, Long zoneId);

    // Spam filter for Equipment Tampering (Uses String alertType)
    boolean existsByVesselIdAndAlertTypeAndResolvedFalse(Long vesselId, String alertType);
}
