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
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Stream;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private static final int MAX_JOB_AGE_DAYS = 7;

    private final JobRepository jobRepository;

    @PostConstruct
    @Transactional
    public void seedJobs() {
        log.info("Mock jobs seeding disabled. Only real harvested JSearch API jobs are active.");
    }


    @Transactional(readOnly = true)
    public List<Job> getAllJobs() {
        return jobRepository.findAll().stream()
                .filter(this::isWithinLastSevenDays)
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public Job getJobById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Job> getTodayJobs() {
        return jobRepository.findAllByPostedDateBetween(LocalDate.now().minusDays(1), LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<Job> searchJobs(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllJobs();
        }
        return jobRepository.searchJobs(query.trim()).stream()
                .filter(this::isWithinLastSevenDays)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Job> filterJobs(String location, String experience, String jobType, String workMode) {
        String cleanLoc = (location == null || location.trim().isEmpty()) ? null : location.trim();
        String cleanExp = (experience == null || experience.trim().isEmpty()) ? null : experience.trim();
        String cleanType = normalizeJobTypeFilter(jobType);
        String cleanMode = (workMode == null || workMode.trim().isEmpty() || workMode.equalsIgnoreCase("All")) ? null : workMode.trim();

        return jobRepository.findAll().stream()
                .filter(this::isWithinLastSevenDays)
                .filter(job -> cleanLoc == null || containsIgnoreCase(job.getLocation(), cleanLoc))
                .filter(job -> cleanExp == null || containsIgnoreCase(job.getExperience(), cleanExp))
                .filter(job -> cleanType == null || normalizeJobType(job).equalsIgnoreCase(cleanType))
                .filter(job -> cleanMode == null || containsIgnoreCase(job.getWorkMode(), cleanMode))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Job> getSimilarJobs(Long id) {
        log.info("Fetching similar jobs, excluding current job ID: {}", id);
        List<Job> allJobs = getAllJobs();
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
        job.setJobType(normalizeJobType(job));
        if (job.getJobSource() == null) {
            job.setJobSource(job.getSource() != null ? job.getSource() : "Unknown");
        }
        if (job.getWorkMode() == null) {
            job.setWorkMode(job.getWorkMode() != null ? job.getWorkMode() : "Onsite");
        }
        return jobRepository.save(job);
    }

    @Transactional(readOnly = true)
    public List<Job> getFreshJobs() {
        return getAllJobs();
    }

    public boolean isFreshJob(Job job) {
        return isWithinLastSevenDays(job);
    }

    // No longer used for filtering — retained for reference only.
    private boolean isStrictRoleMatch(Job job) {
        if (job == null || job.getJobTitle() == null) return false;
        String title = job.getJobTitle().toLowerCase(Locale.ROOT);
        return title.contains("frontend") || 
               title.contains("java") || 
               title.contains("react") || 
               title.contains("database");
    }

    private String normalizeJobTypeFilter(String jobType) {
        if (jobType == null || jobType.trim().isEmpty() || jobType.equalsIgnoreCase("All")) {
            return null;
        }
        return normalizeJobTypeValue(jobType);
    }

    public String normalizeJobType(Job job) {
        if (job == null) {
            return "Full-time";
        }
        String fromFields = normalizeJobTypeValue(
                firstNonBlank(job.getJobType(), job.getEmploymentType(), job.getDescription())
        );
        return fromFields != null ? fromFields : "Full-time";
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        return Arrays.stream(values)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .findFirst()
                .orElse(null);
    }

    private boolean containsIgnoreCase(String haystack, String needle) {
        if (haystack == null || needle == null) {
            return false;
        }
        return haystack.toLowerCase(Locale.ROOT).contains(needle.toLowerCase(Locale.ROOT));
    }

    private String normalizeJobTypeValue(String raw) {
        if (raw == null) {
            return null;
        }

        String value = raw.toLowerCase(Locale.ROOT).replace("-", " ").trim();

        if (value.contains("part time") || value.contains("parttime")) {
            return "Part-time";
        }
        if (value.contains("contract")) {
            return "Contract";
        }
        if (value.contains("intern")) {
            return "Part-time";
        }
        return "Full-time";
    }

    private boolean isWithinLastSevenDays(Job job) {
        if (job == null || job.getPostedDate() == null) {
            return false;
        }

        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.minusDays(MAX_JOB_AGE_DAYS);
        return !job.getPostedDate().isBefore(cutoff) && !job.getPostedDate().isAfter(today);
    }
}
