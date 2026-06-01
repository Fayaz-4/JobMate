package com.jobmate.backend.repository;

import com.jobmate.backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findAllByUserEmailIgnoreCaseOrderByLastUpdatedDesc(String email);

    List<Application> findByUserId(Long userId);

    List<Application> findByUserIdAndStatus(Long userId, String status);

    List<Application> findByJobId(Long jobId);

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, String status);

    long countByUserIdAndStatusIn(Long userId, List<String> statuses);

    @Query("SELECT a FROM Application a WHERE a.user.id = :userId " +
           "AND (:status IS NULL OR LOWER(a.status) = LOWER(:status)) " +
           "AND (:company IS NULL OR LOWER(a.companyName) LIKE LOWER(CONCAT('%', :company, '%'))) " +
           "AND (:role IS NULL OR LOWER(a.jobTitle) LIKE LOWER(CONCAT('%', :role, '%'))) " +
           "AND (:startDate IS NULL OR a.appliedDate >= :startDate) " +
           "AND (:endDate IS NULL OR a.appliedDate <= :endDate) " +
           "AND (:search IS NULL OR LOWER(a.companyName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.jobTitle) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.lastUpdated DESC")
    List<Application> filterAndSearchApplications(
            @Param("userId") Long userId,
            @Param("status") String status,
            @Param("company") String company,
            @Param("role") String role,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("search") String search
    );
}
