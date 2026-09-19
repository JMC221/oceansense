package com.startup1.oceansense.Controllers;

import com.startup1.oceansense.Models.FishType;
import com.startup1.oceansense.Services.FishTypeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fish-types")
@CrossOrigin(origins = "*")
public class FishTypeController {

    private final FishTypeService fishTypeService;

    public FishTypeController(FishTypeService fishTypeService) {
        this.fishTypeService = fishTypeService;
    }

    @GetMapping
    public List<FishType> getAllFishTypes() {
        return fishTypeService.getAllFishTypes();
    }

    @PostMapping
    public FishType createFishType(@Valid @RequestBody FishType fishType) {
        return fishTypeService.createFishType(fishType);
    }

    @PutMapping("/{id}")
    public FishType updateFishType(@PathVariable Long id, @Valid @RequestBody FishType fishType) {
        return fishTypeService.updateFishType(id, fishType);
    }

    @DeleteMapping("/{id}")
    public Void deleteFishType(@PathVariable Long id) {
        fishTypeService.deleteFishType(id);
        return null;
    }
}