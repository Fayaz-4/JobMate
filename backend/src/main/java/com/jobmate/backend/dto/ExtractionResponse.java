package com.jobmate.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionResponse {
    private Long id;
    private Long userId;
    private Long resumeId;
    private String skills;      // JSON string representation
    private String education;   // JSON string representation
    private String projects;    // JSON string representation
    private String experience;  // JSON string representation
    private String keywords;    // JSON string representation
    private LocalDateTime createdAt;
}
