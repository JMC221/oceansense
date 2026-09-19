package com.startup1.oceansense.Repositories;

import com.startup1.oceansense.Models.LogEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


 // Repository for log_entries table.
 
public interface LogEntryRepository extends JpaRepository<LogEntry, Long> {

    // show log entries for a specific trip.
    
    List<LogEntry> findByTripId(Long tripId);
}