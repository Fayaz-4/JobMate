package com.jobmate.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", unique = true, nullable = false)
    @JsonIgnoreProperties({"password", "createdAt"})
    private User user;

    @Column(name = "full_name")
    private String fullName;

    @Column
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    @Column
    private String location;

    @Column
    private String degree;

    @Column
    private String specialization;

    @Column(name = "college_name")
    private String collegeName;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column
    private Double cgpa;

    @Column(name = "preferred_role")
    private String preferredRole;

    @Column(name = "preferred_location")
    private String preferredLocation;

    @Column(name = "experience_level", length = 50)
    private String experienceLevel;

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(name = "github_url", length = 500)
    private String githubUrl;

    @Column(name = "portfolio_url", length = 500)
    private String portfolioUrl;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(name = "profile_photo", columnDefinition = "TEXT")
    private String profilePhoto;

    @Column(name = "profile_photo_position", length = 20)
    private String profilePhotoPosition;

    @Column(name = "profile_completion")
    private Integer profileCompletion;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
