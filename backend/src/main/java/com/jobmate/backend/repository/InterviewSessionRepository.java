package com.jobmate.backend.repository;

import com.jobmate.backend.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findAllByUserEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    List<InterviewSession> findAllByUserEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(String email, String status);
    List<InterviewSession> findAllByApplicationIdOrderByCreatedAtDesc(Long applicationId);
    Long countByUserEmailIgnoreCaseAndStatus(String email, String status);
}
