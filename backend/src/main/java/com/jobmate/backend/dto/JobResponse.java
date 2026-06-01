package com.jobmate.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobResponse {
    private Long id;
    private String jobId;
    private String companyLogo;
    private String employmentType;
    private String source;
    private String jobTitle;
    private String companyName;
    private String location;
    private String salary;
    private String experience;
    private String jobType;
    private String workMode;
    private String jobSource;
    private String jobUrl;
    private String description;
    private String skillsRequired;
    private String bondPeriod;
    private String probationPeriod;
    private String noticePeriod;
    private String companyWebsite;
    private LocalDate postedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Dynamic Matching Fields
    private Integer matchPercentage;
    private java.util.List<String> matchedSkills;
    private java.util.List<String> missingSkills;
}
