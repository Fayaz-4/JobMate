package com.jobmate.backend.service;

import com.jobmate.backend.entity.Job;
import com.jobmate.backend.exception.ResourceNotFoundException;
import com.jobmate.backend.repository.JobRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;

    @PostConstruct
    @Transactional
    public void seedJobs() {
        log.info("Mock jobs seeding disabled. Only real harvested JSearch API jobs are active.");
    }


    @Transactional(readOnly = true)
    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Job getJobById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Job> getTodayJobs() {
        return jobRepository.findAllByPostedDate(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<Job> searchJobs(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllJobs();
        }
        return jobRepository.searchJobs(query.trim());
    }

    @Transactional(readOnly = true)
    public List<Job> filterJobs(String location, String experience, String jobType, String workMode) {
        String cleanLoc = (location == null || location.trim().isEmpty()) ? null : location.trim();
        String cleanExp = (experience == null || experience.trim().isEmpty()) ? null : experience.trim();
        String cleanType = (jobType == null || jobType.trim().isEmpty() || jobType.equalsIgnoreCase("All")) ? null : jobType.trim();
        String cleanMode = (workMode == null || workMode.trim().isEmpty() || workMode.equalsIgnoreCase("All")) ? null : workMode.trim();

        return jobRepository.filterJobs(cleanLoc, cleanExp, cleanType, cleanMode);
    }

    @Transactional(readOnly = true)
    public List<Job> getSimilarJobs(Long id) {
        log.info("Fetching similar jobs, excluding current job ID: {}", id);
        List<Job> allJobs = jobRepository.findAll();
        return allJobs.stream()
                .filter(job -> !job.getId().equals(id))
                .limit(3)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Job getJobByJobId(String jobId) {
        return jobRepository.findByJobId(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with jobId: " + jobId));
    }

    @Transactional
    public Job saveJob(Job job) {
        java.util.Optional<Job> existing = jobRepository.findByJobId(job.getJobId());
        if (existing.isPresent()) {
            return existing.get();
        }
        if (job.getCreatedAt() == null) {
            job.setCreatedAt(LocalDateTime.now());
        }
        if (job.getPostedDate() == null) {
            job.setPostedDate(LocalDate.now());
        }
        if (job.getJobType() == null) {
            job.setJobType(job.getEmploymentType() != null ? job.getEmploymentType() : "Full Time");
        }
        if (job.getJobSource() == null) {
            job.setJobSource(job.getSource() != null ? job.getSource() : "Unknown");
        }
        if (job.getWorkMode() == null) {
            job.setWorkMode(job.getWorkMode() != null ? job.getWorkMode() : "Onsite");
        }
        return jobRepository.save(job);
    }
}
