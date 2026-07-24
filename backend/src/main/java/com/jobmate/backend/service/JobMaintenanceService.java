package com.jobmate.backend.service;

import com.jobmate.backend.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobMaintenanceService {

    private final JobRepository jobRepository;

    // Disabled: job pruning was deleting data faster than it could be replenished, causing empty results on Jobs Page and Daily Digest. Re-enable only once a reliable frequent re-fetch schedule exists.
    // @Scheduled(cron = "0 15 2 * * *")
    @Transactional
    public void pruneOldJobs() {
        LocalDate cutoffDate = LocalDate.now().minusDays(3);
        long before = jobRepository.count();
        jobRepository.deleteByPostedDateBefore(cutoffDate);
        long after = jobRepository.count();
        log.info("Pruned old jobs before {}. Count before: {}, after: {}", cutoffDate, before, after);
    }
}
