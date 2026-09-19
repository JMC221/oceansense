package com.startup1.oceansense.Models;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;

@Entity
@Table(name = "fish_types")
public class FishType {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fish_id")
    @JsonProperty("fish_id") 
    private long id;

    @NotBlank
    @Column(name = "fish_name", nullable = false, unique = true)
    private String fishName;
    
    @JsonIgnore
    @OneToMany(mappedBy = "fishType", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Quota> quota;

    @JsonIgnore
    public long getFishTypeId() {
        return id;
    }
    public void setFishTypeId(long id) {
        this.id = id;
    }

    public List<Quota> getQuota() {
        return quota;
    }

    public void setQuota(List<Quota> quota) {
        this.quota = quota;
    }

    public String getFishName() {
        return fishName;
    }

    public void setFishName(String fishName) {
        this.fishName = fishName;
    }

    
    
}
