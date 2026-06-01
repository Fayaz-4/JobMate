package com.jobmate.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private Long totalApplications;
    private Long appliedCount;
    private Long interviewScheduledCount;
    private Long interviewCompletedCount;
    private Long selectedCount;
    private Long rejectedCount;
    private Long offerReceivedCount;
    private Integer skillsExtractedCount;
    private Long recommendedJobsCount;

    private Integer profileCompletion;
    private Long jobsPostedToday;
    private Boolean resumeUploaded;
    private List<String> topExtractedSkills;
    private List<ApplicationResponse> recentApplications;
    private List<JobResponse> recommendedJobs;
    private List<JobResponse> todayJobs;
}
