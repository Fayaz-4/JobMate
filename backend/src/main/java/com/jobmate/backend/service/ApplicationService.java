package com.jobmate.backend.service;

import com.jobmate.backend.dto.ApplicationRequest;
import com.jobmate.backend.dto.ApplicationResponse;
import com.jobmate.backend.dto.ApplicationStatusUpdateRequest;
import com.jobmate.backend.entity.Application;
import com.jobmate.backend.entity.Job;
import com.jobmate.backend.entity.User;
import com.jobmate.backend.exception.ResourceNotFoundException;
import com.jobmate.backend.repository.ApplicationRepository;
import com.jobmate.backend.repository.JobRepository;
import com.jobmate.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    private static final List<String> VALID_STATUSES = Arrays.asList(
            "Applied", "Interview Scheduled", "Interview Completed", "Selected", "Rejected", "Offer Received"
    );

    @Transactional
    public ApplicationResponse applyJob(ApplicationRequest request, String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Job job = null;
        if (request.getJobId() != null) {
            job = jobRepository.findById(request.getJobId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job not found with ID: " + request.getJobId()));
        }

        Application application = Application.builder()
                .user(user)
                .job(job)
                .companyName(request.getCompanyName())
                .jobTitle(request.getJobTitle())
                .applicationSource(request.getApplicationSource())
                .applicationUrl(request.getApplicationUrl())
                .appliedDate(request.getAppliedDate() != null ? request.getAppliedDate() : LocalDate.now())
                .status("Applied")
                .currentRound(request.getCurrentRound() != null ? request.getCurrentRound() : "None")
                .notes(request.getNotes())
                .createdAt(LocalDateTime.now())
                .lastUpdated(LocalDateTime.now())
                .build();

        Application saved = applicationRepository.save(application);
        log.info("Successfully registered new application ID: {} for user: {} at {}", saved.getId(), email, request.getCompanyName());
        return mapToResponse(saved);
    }

    @Transactional
    public List<ApplicationResponse> getApplications(
            String email,
            String status,
            String company,
            String role,
            LocalDate startDate,
            LocalDate endDate,
            String search
    ) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        // Mock applications seeding disabled. Only real database records are active.


        String cleanStatus = (status == null || status.trim().isEmpty()) ? null : status.trim();
        String cleanCompany = (company == null || company.trim().isEmpty()) ? null : company.trim();
        String cleanRole = (role == null || role.trim().isEmpty()) ? null : role.trim();
        String cleanSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();

        List<Application> list = applicationRepository.filterAndSearchApplications(
                user.getId(), cleanStatus, cleanCompany, cleanRole, startDate, endDate, cleanSearch
        );

        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApplicationResponse getApplication(Long id, String email) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + id));

        if (!application.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("You do not have permission to view this application.");
        }

        return mapToResponse(application);
    }

    @Transactional
    public ApplicationResponse updateStatus(Long id, ApplicationStatusUpdateRequest request, String email) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + id));

        if (!application.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("You do not have permission to modify this application.");
        }

        if (!VALID_STATUSES.contains(request.getStatus())) {
            throw new IllegalArgumentException("Invalid status value. Must be one of: " + VALID_STATUSES);
        }

        application.setStatus(request.getStatus());
        if (request.getCurrentRound() != null) {
            application.setCurrentRound(request.getCurrentRound());
        }
        application.setLastUpdated(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());

        Application updated = applicationRepository.save(application);
        log.info("Successfully updated status of application ID: {} to {} for user: {}", id, request.getStatus(), email);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteApplication(Long id, String email) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + id));

        if (!application.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("You do not have permission to delete this application.");
        }

        applicationRepository.delete(application);
        log.info("Successfully deleted application ID: {} for user: {}", id, email);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getApplicationStats(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Long userId = user.getId();
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("Total Applications", applicationRepository.countByUserId(userId));
        stats.put("Applied", applicationRepository.countByUserIdAndStatus(userId, "Applied"));
        stats.put("In Progress", applicationRepository.countByUserIdAndStatus(userId, "In Progress"));
        stats.put("Assessment", applicationRepository.countByUserIdAndStatus(userId, "Assessment"));
        stats.put("Interview", applicationRepository.countByUserIdAndStatus(userId, "Interview"));
        stats.put("Selected", applicationRepository.countByUserIdAndStatus(userId, "Selected"));
        stats.put("Rejected", applicationRepository.countByUserIdAndStatus(userId, "Rejected"));

        return stats;
    }

    private List<Application> seedMockApplications(User user) {
        LocalDate today = LocalDate.now();

        // Retrieve seeded jobs from database to map relations
        List<Job> jobs = jobRepository.findAll();
        Job googleJob = jobs.stream().filter(j -> j.getCompanyName().contains("Google")).findFirst().orElse(null);
        Job microsoftJob = jobs.stream().filter(j -> j.getCompanyName().contains("Microsoft")).findFirst().orElse(null);
        Job flipkartJob = jobs.stream().filter(j -> j.getCompanyName().contains("Flipkart")).findFirst().orElse(null);
        Job amazonJob = jobs.stream().filter(j -> j.getCompanyName().contains("Amazon")).findFirst().orElse(null);
        Job razorpayJob = jobs.stream().filter(j -> j.getCompanyName().contains("Razorpay")).findFirst().orElse(null);
        Job swiggyJob = jobs.stream().filter(j -> j.getCompanyName().contains("Swiggy")).findFirst().orElse(null);

        List<Application> mockList = Arrays.asList(
                // 1. Google LLC (In Progress)
                Application.builder()
                        .user(user)
                        .job(googleJob)
                        .companyName("Google LLC")
                        .jobTitle("Associate Software Engineer")
                        .applicationSource("LinkedIn")
                        .applicationUrl(googleJob != null ? googleJob.getJobUrl() : "https://careers.google.com")
                        .appliedDate(today.minusDays(2))
                        .status("In Progress")
                        .currentRound("Online Assessment")
                        .notes("Received coding assessment link on Hackerearth. Deadline in 4 days. Need to revise dynamic programming and graph algorithms.")
                        .createdAt(LocalDateTime.now().minusDays(2))
                        .lastUpdated(LocalDateTime.now().minusDays(1))
                        .build(),

                // 2. Microsoft Corp (Selected)
                Application.builder()
                        .user(user)
                        .job(microsoftJob)
                        .companyName("Microsoft Corp")
                        .jobTitle("Full Stack Developer (React & Java)")
                        .applicationSource("Indeed")
                        .applicationUrl(microsoftJob != null ? microsoftJob.getJobUrl() : "https://careers.microsoft.com")
                        .appliedDate(today.minusDays(8))
                        .status("Selected")
                        .currentRound("Completed HR Round")
                        .notes("Successfully completed all rounds of interview! Offer letter received. Currently reviewing salary structure, joining perks, and benefits package.")
                        .createdAt(LocalDateTime.now().minusDays(8))
                        .lastUpdated(LocalDateTime.now().minusDays(2))
                        .build(),

                // 3. Swiggy (Applied)
                Application.builder()
                        .user(user)
                        .job(swiggyJob)
                        .companyName("Swiggy")
                        .jobTitle("QA Automation Analyst")
                        .applicationSource("LinkedIn")
                        .applicationUrl(swiggyJob != null ? swiggyJob.getJobUrl() : "https://swiggy.com/careers")
                        .appliedDate(today)
                        .status("Applied")
                        .currentRound("None")
                        .notes("Applied through Easy Apply on LinkedIn. Resume state is under review by Swiggy talent acquisition team.")
                        .createdAt(LocalDateTime.now())
                        .lastUpdated(LocalDateTime.now())
                        .build(),

                // 4. Razorpay (Interview)
                Application.builder()
                        .user(user)
                        .job(razorpayJob)
                        .companyName("Razorpay")
                        .jobTitle("Spring Boot Developer")
                        .applicationSource("Naukri")
                        .applicationUrl(razorpayJob != null ? razorpayJob.getJobUrl() : "https://razorpay.com/jobs")
                        .appliedDate(today.minusDays(4))
                        .status("Interview")
                        .currentRound("Technical Round 2")
                        .notes("Cleared Technical Round 1 with positive feedback. Next round is a live system design and concurrency coding interview scheduled for next Tuesday at 3:00 PM.")
                        .createdAt(LocalDateTime.now().minusDays(4))
                        .lastUpdated(LocalDateTime.now().minusDays(1))
                        .build(),

                // 5. Flipkart (Assessment)
                Application.builder()
                        .user(user)
                        .job(flipkartJob)
                        .companyName("Flipkart")
                        .jobTitle("Frontend Engineer (React)")
                        .applicationSource("Freshershunt")
                        .applicationUrl(flipkartJob != null ? flipkartJob.getJobUrl() : "https://careers.flipkart.com")
                        .appliedDate(today.minusDays(6))
                        .status("Assessment")
                        .currentRound("Machine Coding Test")
                        .notes("Online machine coding round on React performance optimization and state management components scheduled.")
                        .createdAt(LocalDateTime.now().minusDays(6))
                        .lastUpdated(LocalDateTime.now().minusDays(3))
                        .build(),

                // 6. Amazon Inc (Rejected)
                Application.builder()
                        .user(user)
                        .job(amazonJob)
                        .companyName("Amazon Inc")
                        .jobTitle("Backend Systems Engineer")
                        .applicationSource("Foundit")
                        .applicationUrl(amazonJob != null ? amazonJob.getJobUrl() : "https://amazon.jobs")
                        .appliedDate(today.minusDays(12))
                        .status("Rejected")
                        .currentRound("Technical Interview 1")
                        .notes("Faced difficulty in solving complex low-level design database index questions. Need to focus on LLD mock practices.")
                        .createdAt(LocalDateTime.now().minusDays(12))
                        .lastUpdated(LocalDateTime.now().minusDays(10))
                        .build()
        );

        List<Application> savedList = new ArrayList<>();
        for (Application app : mockList) {
            savedList.add(applicationRepository.save(app));
        }

        return savedList;
    }

    private ApplicationResponse mapToResponse(Application app) {
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
}
