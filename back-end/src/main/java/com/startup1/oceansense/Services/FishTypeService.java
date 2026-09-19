package com.startup1.oceansense.Services;

import com.startup1.oceansense.Models.FishType;
import com.startup1.oceansense.Repositories.FishTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FishTypeService {

    private final FishTypeRepository fishTypeRepository;

    public FishTypeService(FishTypeRepository fishTypeRepository) {
        this.fishTypeRepository = fishTypeRepository;
    }

    public List<FishType> getAllFishTypes() {
        return fishTypeRepository.findAll();
    }

    public FishType createFishType(FishType fishType) {
        return fishTypeRepository.save(fishType);
    }

    public FishType updateFishType(Long id, FishType updated) {
        FishType existing = fishTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FishType not found with id: " + id));
        existing.setFishName(updated.getFishName());
        return fishTypeRepository.save(existing);
    }

    public void deleteFishType(Long id) {
        fishTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FishType not found with id: " + id));
        fishTypeRepository.deleteById(id);
    }
}