package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ExtractedProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExtractedProfileRepository extends JpaRepository<ExtractedProfile, Long> {
    Optional<ExtractedProfile> findByUserId(Long userId);
    Optional<ExtractedProfile> findByUserEmailIgnoreCase(String email);
    Optional<ExtractedProfile> findByResumeId(Long resumeId);
}
