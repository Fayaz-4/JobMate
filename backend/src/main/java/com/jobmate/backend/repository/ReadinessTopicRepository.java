package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ReadinessTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadinessTopicRepository extends JpaRepository<ReadinessTopic, Long> {
    List<ReadinessTopic> findAllByCompanyId(Long companyId);
}
