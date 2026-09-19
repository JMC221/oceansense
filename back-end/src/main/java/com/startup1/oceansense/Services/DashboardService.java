package com.startup1.oceansense.Services;

import com.startup1.oceansense.Models.LogEntry;
import com.startup1.oceansense.Models.Trip;
import com.startup1.oceansense.Repositories.LogEntryRepository;
import com.startup1.oceansense.Repositories.TripRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final LogEntryRepository logEntryRepository;
    private final TripRepository tripRepository;

    public DashboardService(LogEntryRepository logEntryRepository, TripRepository tripRepository) {
        this.logEntryRepository = logEntryRepository;
        this.tripRepository = tripRepository;
    }


    public Map<String, Object> getStats() {
        List<LogEntry> allEntries = logEntryRepository.findAll();
        List<Trip> allTrips = tripRepository.findAll();

        Map<Long, Trip> tripMap = allTrips.stream()
            .collect(Collectors.toMap(Trip::getTripId, t -> t));

        LocalDate today = LocalDate.now();

        // todays catch and weight
        int todaysCatch = 0;
        double todaysWeight = 0;
        for (LogEntry entry : allEntries) {
            Trip trip = tripMap.get(entry.getTripId());
            if (trip != null && trip.getEndTime() != null &&
                trip.getEndTime().toLocalDate().equals(today)) {
                todaysCatch += entry.getQuantity() != null ? entry.getQuantity() : 0;
                todaysWeight += entry.getWeightKg() != null ? entry.getWeightKg() : 0;
            }
        }

        // total trips
        int totalTrips = allTrips.size();

        // weekly activity
        Map<LocalDate, Integer> dailyCatch = new LinkedHashMap<>();
        
        for (int i = 6; i >= 0; i--) {
            dailyCatch.put(today.minusDays(i), 0);
        }

        for (LogEntry entry : allEntries) {
            Trip trip = tripMap.get(entry.getTripId());
            if (trip != null && trip.getEndTime() != null) {
                LocalDate tripDate = trip.getEndTime().toLocalDate();
                if (dailyCatch.containsKey(tripDate)) {
                    int qty = entry.getQuantity() != null ? entry.getQuantity() : 0;
                    dailyCatch.merge(tripDate, qty, Integer::sum);
                }
            }
        }

        List<Map<String, Object>> weeklyActivity = dailyCatch.entrySet().stream()
            .map(e -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("day", e.getKey().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
                map.put("fish", e.getValue());
                return map;
            })
            .collect(Collectors.toList());

        // top species
        Map<String, Integer> speciesMap = new HashMap<>();
        for (LogEntry entry : allEntries) {
            if (entry.getCommonName() != null) {
                int qty = entry.getQuantity() != null ? entry.getQuantity() : 0;
                speciesMap.merge(entry.getCommonName(), qty, Integer::sum);
            }
        }
        List<Map<String, Object>> topSpecies = speciesMap.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(5)
            .map(e -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("species", e.getKey());
                map.put("count", e.getValue());
                return map;
            })
            .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("todaysCatch", todaysCatch);
        result.put("todaysWeight", todaysWeight);
        result.put("totalTrips", totalTrips);
        result.put("weeklyActivity", weeklyActivity);
        result.put("topSpecies", topSpecies);
        return result;
    }
}