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
@Table(name = "readiness_rounds")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private ReadinessCompany company;

    @Column(name = "round_name", nullable = false)
    private String roundName;

    @Column(name = "round_order", nullable = false)
    private int roundOrder;
}
