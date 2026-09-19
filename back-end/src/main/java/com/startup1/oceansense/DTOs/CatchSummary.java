package com.startup1.oceansense.DTOs;

import java.time.LocalDateTime;

public class CatchSummary {

    private Long userId;
    private Long fishID;
    private Double totalWeightKg;
    private LocalDateTime date;

    public CatchSummary(Long userId, Long fishID, Double totalWeightKg, LocalDateTime date) {
        this.userId = userId;
        this.fishID = fishID;
        this.totalWeightKg = totalWeightKg;
        this.date = date;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getFishID() {
        return fishID;
    }

    public Double getTotalWeightKg() {
        return totalWeightKg;
    }

    public LocalDateTime getDate() {
        return date;
    }

}
