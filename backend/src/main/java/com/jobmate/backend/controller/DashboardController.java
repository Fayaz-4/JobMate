package com.jobmate.backend.controller;

import com.jobmate.backend.dto.ApplicationResponse;
import com.jobmate.backend.dto.DashboardResponse;
import com.jobmate.backend.dto.JobResponse;
import com.jobmate.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(Principal principal) {
        DashboardResponse dashboard = dashboardService.getDashboard(principal.getName());
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(Principal principal) {
        DashboardResponse dashboard = dashboardService.getDashboard(principal.getName());
        Map<String, Object> stats = new java.util.LinkedHashMap<>();
        stats.put("totalApplications", dashboard.getTotalApplications() != null ? dashboard.getTotalApplications() : 0L);
        stats.put("appliedCount", dashboard.getAppliedCount() != null ? dashboard.getAppliedCount() : 0L);
        stats.put("interviewScheduledCount", dashboard.getInterviewScheduledCount() != null ? dashboard.getInterviewScheduledCount() : 0L);
        stats.put("interviewCompletedCount", dashboard.getInterviewCompletedCount() != null ? dashboard.getInterviewCompletedCount() : 0L);
        stats.put("selectedCount", dashboard.getSelectedCount() != null ? dashboard.getSelectedCount() : 0L);
        stats.put("rejectedCount", dashboard.getRejectedCount() != null ? dashboard.getRejectedCount() : 0L);
        stats.put("offerReceivedCount", dashboard.getOfferReceivedCount() != null ? dashboard.getOfferReceivedCount() : 0L);
        stats.put("skillsExtractedCount", dashboard.getSkillsExtractedCount() != null ? dashboard.getSkillsExtractedCount() : 0);
        stats.put("recommendedJobsCount", dashboard.getRecommendedJobsCount() != null ? dashboard.getRecommendedJobsCount() : 0L);
        stats.put("profileCompletion", dashboard.getProfileCompletion() != null ? dashboard.getProfileCompletion() : 0);
        stats.put("jobsPostedToday", dashboard.getJobsPostedToday() != null ? dashboard.getJobsPostedToday() : 0L);
        stats.put("resumeUploaded", dashboard.getResumeUploaded() != null ? dashboard.getResumeUploaded() : false);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/today-jobs")
    public ResponseEntity<List<JobResponse>> getTodayJobs() {
        List<JobResponse> jobs = dashboardService.getTodayJobs();
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/todays-jobs")
    public ResponseEntity<List<JobResponse>> getTodaysJobs() {
        List<JobResponse> jobs = dashboardService.getTodayJobs();
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/recommended-jobs")
    public ResponseEntity<List<JobResponse>> getRecommendedJobs(Principal principal) {
        List<JobResponse> recommended = dashboardService.getRecommendedJobs(principal.getName());
        return ResponseEntity.ok(recommended);
    }

    @GetMapping("/recent-applications")
    public ResponseEntity<List<ApplicationResponse>> getRecentApplications(Principal principal) {
        List<ApplicationResponse> recentApps = dashboardService.getRecentApplications(principal.getName());
        return ResponseEntity.ok(recentApps);
    }
}
