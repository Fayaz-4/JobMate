package com.jobmate.backend.controller;

import com.jobmate.backend.dto.JobFilterRequest;
import com.jobmate.backend.dto.JobResponse;
import com.jobmate.backend.dto.JobSearchRequest;
import com.jobmate.backend.entity.Job;
import com.jobmate.backend.service.JobFetchService;
import com.jobmate.backend.service.JobService;
import com.jobmate.backend.service.SkillExtractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final JobFetchService jobFetchService;
    private final SkillExtractionService skillExtractionService;

    @GetMapping
    public ResponseEntity<List<JobResponse>> getAllJobs(Principal principal) {
        List<JobResponse> response = jobService.getAllJobs().stream()
                .map(job -> mapToResponseWithMatching(job, principal))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getJobById(@PathVariable String id, Principal principal) {
        Job job;
        try {
            Long dbId = Long.parseLong(id);
            job = jobService.getJobById(dbId);
        } catch (NumberFormatException e) {
            job = jobService.getJobByJobId(id);
        }
        return ResponseEntity.ok(mapToResponseWithMatching(job, principal));
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<List<JobResponse>> getSimilarJobs(@PathVariable String id, Principal principal) {
        Long dbId;
        try {
            dbId = Long.parseLong(id);
        } catch (NumberFormatException e) {
            Job job = jobService.getJobByJobId(id);
            dbId = job.getId();
        }
        List<JobResponse> response = jobService.getSimilarJobs(dbId).stream()
                .map(job -> mapToResponseWithMatching(job, principal))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/today")
    public ResponseEntity<List<JobResponse>> getTodayJobs(Principal principal) {
        List<JobResponse> response = jobService.getTodayJobs().stream()
                .map(job -> mapToResponseWithMatching(job, principal))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<JobResponse>> getRecommendedJobs(Principal principal) {
        if (principal == null) {
            return ResponseEntity.ok(new ArrayList<>());
        }
        List<JobResponse> response = jobService.getAllJobs().stream()
                .map(job -> mapToResponseWithMatching(job, principal))
                .filter(jobResponse -> jobResponse.getMatchPercentage() != null && jobResponse.getMatchPercentage() > 0)
                .sorted((j1, j2) -> Integer.compare(j2.getMatchPercentage(), j1.getMatchPercentage()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<JobResponse>> searchJobs(@ModelAttribute JobSearchRequest request, Principal principal) {
        List<JobResponse> response = jobService.searchJobs(request.getQuery()).stream()
                .map(job -> mapToResponseWithMatching(job, principal))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<JobResponse>> filterJobs(@ModelAttribute JobFilterRequest request, Principal principal) {
        List<JobResponse> response = jobService.filterJobs(
                request.getLocation(),
                request.getExperience(),
                request.getJobType(),
                request.getWorkMode()
        ).stream()
                .map(job -> mapToResponseWithMatching(job, principal))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<JobResponse> saveJob(@RequestBody Job job) {
        Job saved = jobService.saveJob(job);
        return ResponseEntity.ok(mapToResponse(saved));
    }

    @PostMapping("/fetch")
    public ResponseEntity<Map<String, Object>> fetchJobs(Principal principal) {
        List<String> skills = new ArrayList<>();
        if (principal != null) {
            try {
                skills = skillExtractionService.getExtractedSkills(principal.getName()).getSkills();
            } catch (Exception ignored) {
                skills = new ArrayList<>();
            }
        }

        int storedCount = jobFetchService.fetchAndStoreAllJobs(skills);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Job fetching sequence completed successfully",
                "uniqueJobsSaved", storedCount
        ));
    }

    private JobResponse mapToResponse(Job job) {
        if (job == null) return null;
        String normalizedJobType = jobService.normalizeJobType(job);
        return JobResponse.builder()
                .id(job.getId())
                .jobId(job.getJobId())
                .companyLogo(job.getCompanyLogo())
                .employmentType(job.getEmploymentType())
                .source(job.getSource())
                .jobTitle(job.getJobTitle())
                .companyName(job.getCompanyName())
                .location(job.getLocation())
                .salary(job.getSalary())
                .experience(job.getExperience())
                .jobType(normalizedJobType)
                .workMode(job.getWorkMode())
                .jobSource(job.getJobSource())
                .jobUrl(job.getJobUrl())
                .description(job.getDescription())
                .skillsRequired(job.getSkillsRequired())
                .bondPeriod(job.getBondPeriod())
                .probationPeriod(job.getProbationPeriod())
                .noticePeriod(job.getNoticePeriod())
                .companyWebsite(job.getCompanyWebsite())
                .postedDate(job.getPostedDate())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }

    private JobResponse mapToResponseWithMatching(Job job, Principal principal) {
        if (job == null) return null;
        JobResponse response = mapToResponse(job);

        // Default empty dynamic fields
        response.setMatchPercentage(0);
        response.setMatchedSkills(new ArrayList<>());
        response.setMissingSkills(new ArrayList<>());

        if (principal != null) {
            try {
                com.jobmate.backend.entity.ExtractedProfile profile =
                        skillExtractionService.getExtractedProfileEntity(principal.getName());

                if (profile != null && profile.getSkills() != null) {
                    List<String> userSkills = new ArrayList<>();
                    String rawSkills = profile.getSkills();
                    if (rawSkills.startsWith("[") && rawSkills.endsWith("]")) {
                        String cleaned = rawSkills.substring(1, rawSkills.length() - 1);
                        if (!cleaned.trim().isEmpty()) {
                            String[] tokens = cleaned.split(",");
                            for (String t : tokens) {
                                userSkills.add(t.trim().replaceAll("^\"|\"$", "").toLowerCase());
                            }
                        }
                    }

                    List<String> matchedSkills = new ArrayList<>();
                    List<String> missingSkills = new ArrayList<>();

                    if (job.getSkillsRequired() != null && !job.getSkillsRequired().trim().isEmpty()) {
                        List<String> reqSkills = Arrays.stream(job.getSkillsRequired().split(","))
                                .map(String::trim)
                                .collect(Collectors.toList());

                        for (String rSkill : reqSkills) {
                            if (userSkills.contains(rSkill.toLowerCase())) {
                                matchedSkills.add(rSkill);
                            } else {
                                missingSkills.add(rSkill);
                            }
                        }

                        int matchPercentage = 0;
                        if (!reqSkills.isEmpty()) {
                            matchPercentage = Math.round(((float) matchedSkills.size() / reqSkills.size()) * 100);
                        }
                        response.setMatchPercentage(matchPercentage);
                    }
                    response.setMatchedSkills(matchedSkills);
                    response.setMissingSkills(missingSkills);
                }
            } catch (Exception e) {
                // Return default empty on failure or profile not found
            }
        }

        return response;
    }
}
