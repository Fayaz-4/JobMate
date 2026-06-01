package com.jobmate.backend.repository;

import com.jobmate.backend.entity.HomepageStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HomepageStatsRepository extends JpaRepository<HomepageStats, Long> {
}
