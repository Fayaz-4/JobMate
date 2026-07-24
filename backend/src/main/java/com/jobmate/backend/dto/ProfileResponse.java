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
public class ProfileResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String location;
    private String degree;
    private String specialization;
    private String collegeName;
    private Integer graduationYear;
    private Double cgpa;
    private String preferredRole;
    private String preferredLocation;
    private String experienceLevel;
    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String profilePhoto;
    private String profilePhotoPosition;
    private String skills;
    private Integer profileCompletion;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
