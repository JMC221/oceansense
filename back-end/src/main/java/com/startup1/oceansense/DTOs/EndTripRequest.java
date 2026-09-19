package com.startup1.oceansense.DTOs;

//Request body for ending a trip.
public class EndTripRequest {

    private String status; //"Ended"

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}