package com.jobmate.backend.service;

import com.jobmate.backend.entity.HomepageStats;
import com.jobmate.backend.repository.HomepageStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class HomepageStatsService {

    private final HomepageStatsRepository statsRepository;

    public HomepageStats getStats() {
        return statsRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    log.info("No landing stats found in database. Initializing default stats.");
                    HomepageStats defaultStats = HomepageStats.builder()
                            .totalJobs(1200)
                            .totalCompanies(250)
                            .totalUsers(5000)
                            .build();
                    try {
                        return statsRepository.save(defaultStats);
                    } catch (Exception e) {
                        log.error("Failed to save default stats to database, returning transient object.", e);
                        return defaultStats;
                    }
                });
    }
}
