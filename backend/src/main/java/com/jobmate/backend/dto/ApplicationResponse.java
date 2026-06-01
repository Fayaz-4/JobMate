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
public class ApplicationResponse {

    private Long id;
    private Long userId;
    private String userEmail;
    private Long jobId;
    private String companyName;
    private String jobTitle;
    private String applicationSource;
    private String applicationUrl;
    private LocalDate appliedDate;
    private String status;
    private String currentRound;
    private String notes;
    private LocalDateTime lastUpdated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
