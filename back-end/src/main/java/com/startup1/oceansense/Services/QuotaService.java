package com.startup1.oceansense.Services;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import org.springframework.stereotype.Service;


import com.startup1.oceansense.Models.FishType;
import com.startup1.oceansense.Models.LogEntry;
import com.startup1.oceansense.Models.Quota;
import com.startup1.oceansense.Models.Trip;
import com.startup1.oceansense.Models.User;
import com.startup1.oceansense.Repositories.FishTypeRepository;
import com.startup1.oceansense.Repositories.LogEntryRepository;
import com.startup1.oceansense.Repositories.QuotaRepository;
import com.startup1.oceansense.Repositories.TripRepository;
import com.startup1.oceansense.Repositories.UserRepository;
import com.startup1.oceansense.DTOs.CatchSummary;
import com.startup1.oceansense.DTOs.QuotaDTO;

@Service
public class QuotaService {

    private final QuotaRepository quotaRepository;
    private final UserRepository userRepository;
    private final FishTypeRepository fishTypeRepository;
    private final TripRepository tripRepository;
    private final LogEntryRepository logEntryRepository;

    public QuotaService(QuotaRepository quotaRepository,
            UserRepository userRepository,
            FishTypeRepository fishTypeRepository,
            TripRepository tripRepository,
            LogEntryRepository logEntryRepository) {
        this.quotaRepository = quotaRepository;
        this.userRepository = userRepository;
        this.fishTypeRepository = fishTypeRepository;
        this.tripRepository = tripRepository;
        this.logEntryRepository = logEntryRepository;
    }

    private QuotaDTO toDTO(Quota quota) {
        return new QuotaDTO(
            quota.getId(),
            quota.getUser().getUserId(),
            quota.getFishType().getFishTypeId(),
            quota.getFishType().getFishName(),
            quota.getWeightLimitKg(),
            quota.getFrequency()
        );
    }

    public List<QuotaDTO> getQuotas() {
        return quotaRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public QuotaDTO createQuota(Quota quota) {
        User user = userRepository.findById(quota.getUser().getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        quota.setUser(user);

        FishType fishType = fishTypeRepository.findById(quota.getFishType().getFishTypeId())
                .orElseThrow(() -> new RuntimeException("Fish type not found"));
        quota.setFishType(fishType);

        return toDTO(quotaRepository.save(quota));
    }

    public List<QuotaDTO> getQuotasByUserId(Long userId) {
        return quotaRepository.findByUserUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<QuotaDTO> getQuotasByFishTypeId(Long fishId) {
        return quotaRepository.findByFishTypeId(fishId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public QuotaDTO updateQuota(Long quotaId, Quota updatedQuota) {
        return quotaRepository.findById(quotaId).map(quota -> {
            quota.setWeightLimitKg(updatedQuota.getWeightLimitKg());
            quota.setFrequency(updatedQuota.getFrequency());

            if(updatedQuota.getUser() != null) {
                User user = userRepository.findById(updatedQuota.getUser().getUserId())
                        .orElseThrow(() -> new RuntimeException("User not found"));
                quota.setUser(user);
            }

            if(updatedQuota.getFishType() != null) {
                FishType fishType = fishTypeRepository.findById(updatedQuota.getFishType().getFishTypeId())
                        .orElseThrow(() -> new RuntimeException("Fish type not found"));
                quota.setFishType(fishType);
            }

            return toDTO(quotaRepository.save(quota));
        }).orElseThrow(() -> new RuntimeException("Quota not found with id " + quotaId));
    }

    public List<CatchSummary> getCatchSummary() {
        List<LogEntry> logEntries = logEntryRepository.findAll();
        List<Trip> trips = tripRepository.findAll();

        Map<Long, Trip> tripMap = trips.stream()
        .collect(Collectors.toMap(Trip::getTripId, t -> t));

        List<CatchSummary> result = new ArrayList<>();
        
        for (LogEntry entry : logEntries) {
        Trip trip = tripMap.get(entry.getTripId());
        if (trip == null) continue;

        result.add(new CatchSummary(
            trip.getCaptainId(),
            entry.getFishId(),
            entry.getWeightKg(),
            trip.getStartTime()  
        ));
    }
     
        return result;  
    }


    public void deleteQuota(Long quotaId) {
        quotaRepository.deleteById(quotaId);
    }
}