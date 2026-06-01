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
@Table(name = "readiness_questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private ReadinessCompany company;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "round_type", nullable = false, length = 100)
    private String roundType;

    @Column(nullable = false, length = 50)
    private String difficulty;
}
