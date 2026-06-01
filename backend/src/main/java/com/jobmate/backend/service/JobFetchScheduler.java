package com.jobmate.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobFetchScheduler {

    private final JobFetchService jobFetchService;

    // Standard cron expression: "0 0 */6 * * *" triggers every 6 hours
    // @Scheduled(cron = "0 0 */6 * * *")
    public void fetchJobsScheduled() {
        log.info("Cron Trigger: Automated background harvesting is disabled. Only direct JSearch is active.");
    }

}
