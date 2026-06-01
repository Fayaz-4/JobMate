package com.jobmate.backend.repository;

import com.jobmate.backend.entity.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findAllBySessionIdOrderByCreatedAtAsc(Long sessionId);
}
