package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ExtractedSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExtractedSkillRepository extends JpaRepository<ExtractedSkill, Long> {
    List<ExtractedSkill> findByResumeId(Long resumeId);
    List<ExtractedSkill> findByUserId(Long userId);
    void deleteByResumeId(Long resumeId);
    void deleteByUserId(Long userId);
}
