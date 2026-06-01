package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ExtractedExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExtractedExperienceRepository extends JpaRepository<ExtractedExperience, Long> {
    List<ExtractedExperience> findByResumeId(Long resumeId);
    List<ExtractedExperience> findByUserId(Long userId);
    void deleteByResumeId(Long resumeId);
    void deleteByUserId(Long userId);
}
