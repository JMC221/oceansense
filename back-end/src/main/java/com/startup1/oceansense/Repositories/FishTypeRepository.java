package com.startup1.oceansense.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.startup1.oceansense.Models.FishType;

public interface FishTypeRepository extends JpaRepository<FishType, Long> {
    
}
