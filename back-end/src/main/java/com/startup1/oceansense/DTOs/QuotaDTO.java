package com.startup1.oceansense.DTOs;

import com.startup1.oceansense.Frequency;

public class QuotaDTO {
    
    private long quotaId;
    private long userId;
    private long fishId;
    private String fishName;
    private Double weightLimitKg;
    private Frequency frequency;

    public QuotaDTO(long quotaId, long userId, long fishId, String fishName, Double weightLimitKg, Frequency frequency) {
        this.quotaId = quotaId;
        this.userId = userId;
        this.fishId = fishId;
        this.fishName = fishName;
        this.weightLimitKg = weightLimitKg;
        this.frequency = frequency;
    }

    public long getQuotaId() { return quotaId; }
    public long getUserId() { return userId; }
    public long getFishId() { return fishId; }
    public String getFishName() { return fishName; }
    public Double getWeightLimitKg() { return weightLimitKg; }
    public Frequency getFrequency() { return frequency; }
}
    


