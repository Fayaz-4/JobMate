package com.jobmate.backend.repository;

import com.jobmate.backend.entity.PlacementReadiness;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlacementReadinessRepository extends JpaRepository<PlacementReadiness, Long> {
    Optional<PlacementReadiness> findByApplicationId(Long applicationId);
    void deleteByApplicationId(Long applicationId);
}
