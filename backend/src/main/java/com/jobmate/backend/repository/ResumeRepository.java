package com.jobmate.backend.repository;

import com.jobmate.backend.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    @Query("SELECT r FROM Resume r WHERE r.user.id = :userId AND r.uploadStatus = 'ACTIVE'")
    Optional<Resume> findByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM Resume r WHERE LOWER(r.user.email) = LOWER(:email) AND r.uploadStatus = 'ACTIVE'")
    Optional<Resume> findByUserEmailIgnoreCase(@Param("email") String email);
}
