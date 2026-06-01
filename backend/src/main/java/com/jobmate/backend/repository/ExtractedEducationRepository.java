package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ExtractedEducation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExtractedEducationRepository extends JpaRepository<ExtractedEducation, Long> {
    List<ExtractedEducation> findByResumeId(Long resumeId);
    List<ExtractedEducation> findByUserId(Long userId);
    void deleteByResumeId(Long resumeId);
    void deleteByUserId(Long userId);
}
