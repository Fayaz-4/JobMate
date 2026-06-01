package com.jobmate.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", unique = true)
    private String jobId;

    @Column(name = "company_logo", length = 1000)
    private String companyLogo;

    @Column(name = "employment_type")
    private String employmentType;

    private String source;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String salary;

    @Column(nullable = false)
    private String experience;

    @Column(name = "job_type", nullable = false, length = 100)
    private String jobType;

    @Column(name = "work_mode", nullable = false, length = 100)
    private String workMode;

    @Column(name = "job_source", nullable = false, length = 100)
    private String jobSource;

    @Column(name = "job_url", length = 500)
    private String jobUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "skills_required", length = 500)
    private String skillsRequired;

    @Column(name = "bond_period")
    private String bondPeriod;

    @Column(name = "probation_period")
    private String probationPeriod;

    @Column(name = "notice_period")
    private String noticePeriod;

    @Column(name = "company_website")
    private String companyWebsite;

    @Column(name = "posted_date", nullable = false)
    private LocalDate postedDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
