package com.jobmate.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobmate.backend.dto.ApplicationResponse;
import com.jobmate.backend.dto.DashboardResponse;
import com.jobmate.backend.dto.JobResponse;
import com.jobmate.backend.entity.Application;
import com.jobmate.backend.entity.Job;
import com.jobmate.backend.entity.Profile;
import com.jobmate.backend.entity.User;
import com.jobmate.backend.exception.ResourceNotFoundException;
import com.jobmate.backend.entity.ExtractedSkill;
import com.jobmate.backend.repository.ApplicationRepository;
import com.jobmate.backend.repository.ExtractedProfileRepository;
import com.jobmate.backend.repository.ExtractedSkillRepository;
import com.jobmate.backend.repository.JobRepository;
import com.jobmate.backend.repository.ProfileRepository;
import com.jobmate.backend.repository.ResumeRepository;
import com.jobmate.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final ResumeRepository resumeRepository;
    private final ExtractedProfileRepository extractedProfileRepository;
    private final ExtractedSkillRepository extractedSkillRepository;
    private final ProfileService profileService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Integer completion = getProfileCompletion(user);
        Long totalApps = applicationRepository.countByUserId(user.getId());
        Long applied = applicationRepository.countByUserIdAndStatus(user.getId(), "Applied");
        Long interviewScheduled = applicationRepository.countByUserIdAndStatus(user.getId(), "Interview Scheduled");
        Long interviewCompleted = applicationRepository.countByUserIdAndStatus(user.getId(), "Interview Completed");
        Long selected = applicationRepository.countByUserIdAndStatus(user.getId(), "Selected");
        Long rejected = applicationRepository.countByUserIdAndStatus(user.getId(), "Rejected");
        Long offerReceived = applicationRepository.countByUserIdAndStatus(user.getId(), "Offer Received");
        
        List<JobResponse> todayJobs = getTodayJobs();
        Long todayJobsCount = (long) todayJobs.size();
        Boolean resumeUploaded = getResumeStatus(user);

        // Extracted resume skills matching
        List<ExtractedSkill> extractedSkills = extractedSkillRepository.findByUserId(user.getId());
        List<String> userSkills = extractedSkills.stream()
                .map(ExtractedSkill::getSkillName)
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toList());

        List<String> topExtractedSkills = extractedSkills.stream()
                .map(ExtractedSkill::getSkillName)
                .map(String::trim)
                .collect(Collectors.toList());

        int skillsExtractedCount = userSkills.size();

        // Count recommended jobs based on skills
        List<Job> allJobs = jobRepository.findAll();
        List<ScoredJob> scoredJobs = new ArrayList<>();

        for (Job job : allJobs) {
            String jobSkillsStr = job.getSkillsRequired();
            if (jobSkillsStr == null || jobSkillsStr.trim().isEmpty()) {
                continue;
            }
            List<String> jobSkills = Arrays.stream(jobSkillsStr.split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());

            if (jobSkills.isEmpty()) {
                continue;
            }

            int matchedCount = 0;
            for (String js : jobSkills) {
                if (userSkills.contains(js)) {
                    matchedCount++;
                }
            }

            if (matchedCount > 0) {
                int matchPercent = (int) Math.round(((double) matchedCount / jobSkills.size()) * 100);
                
                List<String> matchedSkillsOutput = new ArrayList<>();
                for (ExtractedSkill es : extractedSkills) {
                    if (jobSkills.contains(es.getSkillName().toLowerCase())) {
                        matchedSkillsOutput.add(es.getSkillName());
                    }
                }
                final List<String> distinctMatched = matchedSkillsOutput.stream().distinct().collect(Collectors.toList());

                List<String> missingSkillsOutput = Arrays.stream(jobSkillsStr.split(","))
                        .map(String::trim)
                        .filter(s -> !distinctMatched.stream().anyMatch(m -> m.equalsIgnoreCase(s)))
                        .collect(Collectors.toList());

                scoredJobs.add(new ScoredJob(job, matchPercent, distinctMatched, missingSkillsOutput));
            }
        }

        // Sort scored jobs descending
        scoredJobs.sort((sj1, sj2) -> Integer.compare(sj2.matchPercent, sj1.matchPercent));

        long recommendedJobsCount = scoredJobs.size();

        List<JobResponse> recommendedJobs = scoredJobs.stream()
                .limit(5)
                .map(sj -> {
                    JobResponse jr = mapToJobResponse(sj.job);
                    jr.setMatchPercentage(sj.matchPercent);
                    jr.setMatchedSkills(sj.matchedSkills);
                    jr.setMissingSkills(sj.missingSkills);
                    return jr;
                })
                .collect(Collectors.toList());

        List<ApplicationResponse> recentApps = getRecentApplications(user);

        return DashboardResponse.builder()
                .totalApplications(totalApps)
                .appliedCount(applied)
                .interviewScheduledCount(interviewScheduled)
                .interviewCompletedCount(interviewCompleted)
                .selectedCount(selected)
                .rejectedCount(rejected)
                .offerReceivedCount(offerReceived)
                .skillsExtractedCount(skillsExtractedCount)
                .recommendedJobsCount(recommendedJobsCount)
                .profileCompletion(completion)
                .jobsPostedToday(todayJobsCount)
                .resumeUploaded(resumeUploaded)
                .topExtractedSkills(topExtractedSkills)
                .recentApplications(recentApps)
                .recommendedJobs(recommendedJobs)
                .todayJobs(todayJobs)
                .build();
    }

    @Transactional(readOnly = true)
    public Integer getProfileCompletion(User user) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(user.getId());
        if (profileOpt.isEmpty()) {
            Profile tempProfile = Profile.builder()
                    .user(user)
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .build();
            return profileService.calculateProfileCompletion(tempProfile);
        }
        return profileService.calculateProfileCompletion(profileOpt.get());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getApplicationStats(User user) {
        Long userId = user.getId();
        Long applied = applicationRepository.countByUserIdAndStatus(userId, "Applied");
        Long interviewScheduled = applicationRepository.countByUserIdAndStatus(userId, "Interview Scheduled");
        Long interviewCompleted = applicationRepository.countByUserIdAndStatus(userId, "Interview Completed");
        Long selected = applicationRepository.countByUserIdAndStatus(userId, "Selected");
        Long rejected = applicationRepository.countByUserIdAndStatus(userId, "Rejected");
        Long offerReceived = applicationRepository.countByUserIdAndStatus(userId, "Offer Received");

        List<ExtractedSkill> extractedSkills = extractedSkillRepository.findByUserId(userId);
        long skillsExtracted = extractedSkills.size();

        // Calculate matching recommended jobs count
        List<String> userSkills = extractedSkills.stream()
                .map(ExtractedSkill::getSkillName)
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toList());

        List<Job> allJobs = jobRepository.findAll();
        long recommendedCount = 0;
        for (Job job : allJobs) {
            String jobSkillsStr = job.getSkillsRequired();
            if (jobSkillsStr != null && !jobSkillsStr.trim().isEmpty()) {
                List<String> jobSkills = Arrays.stream(jobSkillsStr.split(","))
                        .map(String::trim)
                        .map(String::toLowerCase)
                        .collect(Collectors.toList());
                boolean matches = false;
                for (String js : jobSkills) {
                    if (userSkills.contains(js)) {
                        matches = true;
                        break;
                    }
                }
                if (matches) {
                    recommendedCount++;
                }
            }
        }
        
        return Map.of(
                "totalApplications", applicationRepository.countByUserId(userId),
                "appliedCount", applied,
                "interviewScheduledCount", interviewScheduled,
                "interviewCompletedCount", interviewCompleted,
                "selectedCount", selected,
                "rejectedCount", rejected,
                "offerReceivedCount", offerReceived,
                "skillsExtractedCount", skillsExtracted,
                "recommendedJobsCount", recommendedCount
        );
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getTodayJobs() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        List<Job> jobs = jobRepository.findAllByPostedDateBetween(yesterday, today);
        return jobs.stream()
                .map(this::mapToJobResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getRecentApplications(User user) {
        List<Application> list = applicationRepository.findAllByUserEmailIgnoreCaseOrderByLastUpdatedDesc(user.getEmail());
        return list.stream()
                .limit(5)
                .map(this::mapToApplicationResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Boolean getResumeStatus(User user) {
        return resumeRepository.findByUserId(user.getId()).isPresent();
    }

    @Transactional(readOnly = true)
    public Integer getSkillCount(User user) {
        return extractedProfileRepository.findByUserId(user.getId())
                .map(profile -> {
                    try {
                        String skillsJson = profile.getSkills();
                        if (skillsJson == null || skillsJson.trim().isEmpty()) {
                            return 0;
                        }
                        List<String> list = objectMapper.readValue(
                                skillsJson,
                                new TypeReference<List<String>>() {}
                        );
                        return list != null ? list.size() : 0;
                    } catch (Exception e) {
                        log.warn("Failed to parse skills JSON for user {}: {}", user.getEmail(), e.getMessage());
                        return 0;
                    }
                })
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getRecommendedJobs(User user) {
        List<ExtractedSkill> extractedSkills = extractedSkillRepository.findByUserId(user.getId());
        List<String> userSkills = extractedSkills.stream()
                .map(ExtractedSkill::getSkillName)
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toList());

        List<Job> allJobs = jobRepository.findAll();
        List<ScoredJob> scoredJobs = new ArrayList<>();

        for (Job job : allJobs) {
            String jobSkillsStr = job.getSkillsRequired();
            if (jobSkillsStr == null || jobSkillsStr.trim().isEmpty()) {
                continue;
            }
            List<String> jobSkills = Arrays.stream(jobSkillsStr.split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());

            if (jobSkills.isEmpty()) {
                continue;
            }

            int matchedCount = 0;
            for (String js : jobSkills) {
                if (userSkills.contains(js)) {
                    matchedCount++;
                }
            }

            if (matchedCount > 0) {
                int matchPercent = (int) Math.round(((double) matchedCount / jobSkills.size()) * 100);
                
                List<String> matchedSkillsOutput = new ArrayList<>();
                for (ExtractedSkill es : extractedSkills) {
                    if (jobSkills.contains(es.getSkillName().toLowerCase())) {
                        matchedSkillsOutput.add(es.getSkillName());
                    }
                }
                final List<String> distinctMatched = matchedSkillsOutput.stream().distinct().collect(Collectors.toList());

                List<String> missingSkillsOutput = Arrays.stream(jobSkillsStr.split(","))
                        .map(String::trim)
                        .filter(s -> !distinctMatched.stream().anyMatch(m -> m.equalsIgnoreCase(s)))
                        .collect(Collectors.toList());

                scoredJobs.add(new ScoredJob(job, matchPercent, distinctMatched, missingSkillsOutput));
            }
        }

        scoredJobs.sort((sj1, sj2) -> Integer.compare(sj2.matchPercent, sj1.matchPercent));

        return scoredJobs.stream()
                .limit(5)
                .map(sj -> {
                    JobResponse jr = mapToJobResponse(sj.job);
                    jr.setMatchPercentage(sj.matchPercent);
                    jr.setMatchedSkills(sj.matchedSkills);
                    jr.setMissingSkills(sj.missingSkills);
                    return jr;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getRecentApplications(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return getRecentApplications(user);
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getRecommendedJobs(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return getRecommendedJobs(user);
    }

    private JobResponse mapToJobResponse(Job job) {
        if (job == null) return null;
        return JobResponse.builder()
                .id(job.getId())
                .jobTitle(job.getJobTitle())
                .companyName(job.getCompanyName())
                .location(job.getLocation())
                .salary(job.getSalary())
                .experience(job.getExperience())
                .jobType(job.getJobType())
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

    private ApplicationResponse mapToApplicationResponse(Application app) {
        if (app == null) return null;
        return ApplicationResponse.builder()
                .id(app.getId())
                .userId(app.getUser().getId())
                .userEmail(app.getUser().getEmail())
                .jobId(app.getJob() != null ? app.getJob().getId() : null)
                .companyName(app.getCompanyName())
                .jobTitle(app.getJobTitle())
                .applicationSource(app.getApplicationSource())
                .applicationUrl(app.getApplicationUrl())
                .appliedDate(app.getAppliedDate())
                .status(app.getStatus())
                .currentRound(app.getCurrentRound())
                .notes(app.getNotes())
                .lastUpdated(app.getLastUpdated())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }

    private static class ScoredJob {
        final Job job;
        final int matchPercent;
        final List<String> matchedSkills;
        final List<String> missingSkills;

        ScoredJob(Job job, int matchPercent, List<String> matchedSkills, List<String> missingSkills) {
            this.job = job;
            this.matchPercent = matchPercent;
            this.matchedSkills = matchedSkills;
            this.missingSkills = missingSkills;
        }
    }
}
