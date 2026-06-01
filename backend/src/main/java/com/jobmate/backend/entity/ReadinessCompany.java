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
@Table(name = "readiness_companies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessCompany {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", unique = true, nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false, length = 50)
    private String difficulty;

    @Column(name = "estimated_preparation_time", nullable = false, length = 100)
    private String estimatedPreparationTime;
}
