package com.startup1.oceansense.Controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.startup1.oceansense.Models.Quota;
import com.startup1.oceansense.Services.QuotaService;
import com.startup1.oceansense.DTOs.CatchSummary;
import com.startup1.oceansense.DTOs.QuotaDTO;

@RestController
@RequestMapping("/api/v1/quota")
@CrossOrigin(origins = "*")
public class QuotaController {
    
    private final QuotaService quotaService;

    public QuotaController(QuotaService quotaService) {
        this.quotaService = quotaService;
    }

    @GetMapping("/quotas")
    public ResponseEntity<List<QuotaDTO>> getQuotas() {
        return ResponseEntity.ok(quotaService.getQuotas());
    }

    @GetMapping("/catch-summary")
    public List<CatchSummary> getCatchSummary() {
        return quotaService.getCatchSummary();
    }

    @PostMapping("/create")
    public ResponseEntity<QuotaDTO> createQuota(@RequestBody Quota quota) {
        return ResponseEntity.ok(quotaService.createQuota(quota));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<QuotaDTO> updateQuota(@PathVariable Long id, @RequestBody Quota quota) {
        return ResponseEntity.ok(quotaService.updateQuota(id, quota));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteQuota(@PathVariable Long id) {
        quotaService.deleteQuota(id);
        return ResponseEntity.noContent().build();
    }
}