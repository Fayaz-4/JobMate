package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ReadinessQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadinessQuestionRepository extends JpaRepository<ReadinessQuestion, Long> {
    List<ReadinessQuestion> findAllByCompanyId(Long companyId);
}
