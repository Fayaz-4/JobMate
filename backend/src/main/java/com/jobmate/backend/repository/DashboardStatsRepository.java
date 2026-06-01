package com.jobmate.backend.repository;

import com.jobmate.backend.entity.DashboardStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DashboardStatsRepository extends JpaRepository<DashboardStats, Long> {
    Optional<DashboardStats> findByUserId(Long userId);
    Optional<DashboardStats> findByUserEmailIgnoreCase(String email);
}
