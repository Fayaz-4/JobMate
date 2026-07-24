package com.jobmate.backend.repository;

import com.jobmate.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findAllByPostedDate(LocalDate date);

    @Query("SELECT j FROM Job j WHERE j.postedDate >= :startDate AND j.postedDate <= :endDate")
    List<Job> findAllByPostedDateBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<Job> findByLocation(String location);
    List<Job> findByJobTitle(String jobTitle);
    List<Job> findByCompanyName(String companyName);
    List<Job> findByPostedDate(LocalDate postedDate);

    boolean existsByCompanyNameAndJobTitleAndLocationAndPostedDateAndJobUrl(
            String companyName, String jobTitle, String location, LocalDate postedDate, String jobUrl);

    @Query("SELECT j FROM Job j WHERE " +
           "LOWER(j.jobTitle) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(j.companyName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(j.skillsRequired) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Job> searchJobs(@Param("q") String query);

    @Query("SELECT j FROM Job j WHERE " +
           "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:experience IS NULL OR LOWER(j.experience) LIKE LOWER(CONCAT('%', :experience, '%'))) AND " +
           "(:jobType IS NULL OR LOWER(j.jobType) = LOWER(:jobType)) AND " +
           "(:workMode IS NULL OR LOWER(j.workMode) = LOWER(:workMode))")
    List<Job> filterJobs(
            @Param("location") String location,
            @Param("experience") String experience,
            @Param("jobType") String jobType,
            @Param("workMode") String workMode
    );

    java.util.Optional<Job> findByJobId(String jobId);

    void deleteByPostedDateBefore(LocalDate cutoffDate);

    List<Job> findByPostedDateBetween(LocalDate startDate, LocalDate endDate);
}
