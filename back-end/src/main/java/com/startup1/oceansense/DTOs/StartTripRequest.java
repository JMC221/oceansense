package com.startup1.oceansense.DTOs;

//Request  starting a trip.
public class StartTripRequest {

    private Long captainId;
    private Long vesselId;

    public Long getCaptainId() {
        return captainId;
    }

    public void setCaptainId(Long captainId) {
        this.captainId = captainId;
    }

    public Long getVesselId() {
        return vesselId;
    }

    public void setVesselId(Long vesselId) {
        this.vesselId = vesselId;
    }
}