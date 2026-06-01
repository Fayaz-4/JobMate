package com.jobmate.backend.repository;

import com.jobmate.backend.entity.ReadinessResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadinessResourceRepository extends JpaRepository<ReadinessResource, Long> {
    List<ReadinessResource> findAllByCompanyId(Long companyId);
}
