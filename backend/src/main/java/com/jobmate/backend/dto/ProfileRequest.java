package com.jobmate.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9\\s\\-()]{8,20}$", message = "Invalid phone number format. Enter a valid 8-20 digit number.")
    private String phone;

    private LocalDate dateOfBirth;
    private String gender;
    private String location;
    private String degree;
    private String specialization;
    private String collegeName;
    private Integer graduationYear;
    private Double cgpa;

    @NotBlank(message = "Preferred role is required")
    private String preferredRole;

    @NotBlank(message = "Preferred location is required")
    private String preferredLocation;

    private String experienceLevel;

    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;
    private String profilePhoto;
    private String profilePhotoPosition;
    
    private String skills;
}
