package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ExtractedProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExtractedProjectRepository extends JpaRepository<ExtractedProject, Long> {
    List<ExtractedProject> findByResumeId(Long resumeId);
    List<ExtractedProject> findByUserId(Long userId);
    void deleteByResumeId(Long resumeId);
    void deleteByUserId(Long userId);
}
