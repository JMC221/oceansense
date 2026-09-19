package com.startup1.oceansense.Repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.startup1.oceansense.Models.Quota;

public interface QuotaRepository extends JpaRepository<Quota, Long> {
    List<Quota> findByUserUserId(Long userId);
    List<Quota> findByFishTypeId(Long fishId);

}

