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

@Entity
@Table(name = "dashboard_stats")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", unique = true, nullable = false)
    @JsonIgnoreProperties({"password", "createdAt"})
    private User user;

    @Column(name = "matched_jobs", nullable = false)
    private Integer matchedJobs;

    @Column(nullable = false)
    private Integer applications;

    @Column(nullable = false)
    private Integer interviews;

    @Column(name = "selected_jobs", nullable = false)
    private Integer selectedJobs;

    @Column(name = "todays_jobs", nullable = false)
    private Integer todaysJobs;

    @Column(name = "profile_completion", nullable = false)
    private Integer profileCompletion;
}
