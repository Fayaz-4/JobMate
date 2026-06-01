package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ReadinessCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReadinessCompanyRepository extends JpaRepository<ReadinessCompany, Long> {
    Optional<ReadinessCompany> findByCompanyNameIgnoreCase(String companyName);
}
