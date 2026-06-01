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

import java.time.LocalDateTime;

@Entity
@Table(name = "extracted_projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractedProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "resume_id", nullable = false)
    private Long resumeId;

    @Column(name = "project_name")
    private String projectName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "technologies_used", length = 500)
    private String technologiesUsed;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
