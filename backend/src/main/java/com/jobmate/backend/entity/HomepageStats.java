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

@Entity
@Table(name = "homepage_stats")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomepageStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_jobs", nullable = false)
    private Integer totalJobs;

    @Column(name = "total_companies", nullable = false)
    private Integer totalCompanies;

    @Column(name = "total_users", nullable = false)
    private Integer totalUsers;
}
