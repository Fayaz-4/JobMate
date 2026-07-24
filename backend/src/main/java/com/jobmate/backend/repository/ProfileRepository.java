package com.jobmate.backend.repository;

import com.jobmate.backend.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUserId(Long userId);
    Optional<Profile> findByUserEmailIgnoreCase(String email);
    boolean existsByUserId(Long userId);
}

