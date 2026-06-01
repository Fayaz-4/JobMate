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
@Table(name = "readiness_topics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private ReadinessCompany company;

    @Column(name = "topic_name", nullable = false)
    private String topicName;

    @Column(name = "topic_category", nullable = false, length = 100)
    private String topicCategory;

    @Column(nullable = false, length = 50)
    private String difficulty;

    @Column(nullable = false, length = 50)
    private String frequency;
}
