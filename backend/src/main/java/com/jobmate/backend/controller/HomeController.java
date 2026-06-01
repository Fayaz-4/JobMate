package com.jobmate.backend.controller;

import com.jobmate.backend.entity.HomepageStats;
import com.jobmate.backend.service.HomepageStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomepageStatsService statsService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHomeStats() {
        HomepageStats stats = statsService.getStats();
        
        Map<String, Object> response = new HashMap<>();
        response.put("platformName", "JobMate");
        response.put("totalJobs", stats.getTotalJobs());
        response.put("totalCompanies", stats.getTotalCompanies());
        response.put("totalUsers", stats.getTotalUsers());
        
        return ResponseEntity.ok(response);
    }
}
