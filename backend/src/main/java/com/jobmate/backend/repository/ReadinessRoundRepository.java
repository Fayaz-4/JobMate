package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ReadinessRound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadinessRoundRepository extends JpaRepository<ReadinessRound, Long> {
    List<ReadinessRound> findAllByCompanyIdOrderByRoundOrderAsc(Long companyId);
}
