package com.jobmate.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "readiness_resources")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private ReadinessCompany company;

    @Column(name = "resource_name", nullable = false)
    private String resourceName;

    @Column(name = "resource_url", nullable = false, length = 500)
    private String resourceUrl;

    @Column(name = "resource_type", nullable = false, length = 100)
    private String resourceType;
}
