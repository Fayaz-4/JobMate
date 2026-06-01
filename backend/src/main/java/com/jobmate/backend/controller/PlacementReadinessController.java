package com.jobmate.backend.controller;

import com.jobmate.backend.entity.ReadinessQuestion;
import com.jobmate.backend.entity.ReadinessResource;
import com.jobmate.backend.entity.ReadinessRound;
import com.jobmate.backend.service.PlacementReadinessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/readiness")
@RequiredArgsConstructor
public class PlacementReadinessController {

    private final PlacementReadinessService placementReadinessService;

    @GetMapping("/applied-companies")
    public ResponseEntity<List<Map<String, Object>>> getAppliedCompanies(Principal principal) {
        List<Map<String, Object>> list = placementReadinessService.getAppliedCompanies(principal.getName());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/company/{id}")
    public ResponseEntity<Map<String, Object>> getCompanyGuide(@PathVariable Long id) {
        Map<String, Object> guide = placementReadinessService.getCompanyGuide(id);
        return ResponseEntity.ok(guide);
    }

    @GetMapping("/hiring-process/{id}")
    public ResponseEntity<List<ReadinessRound>> getHiringProcess(@PathVariable Long id) {
        List<ReadinessRound> rounds = placementReadinessService.getHiringProcess(id);
        return ResponseEntity.ok(rounds);
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<List<ReadinessQuestion>> getQuestions(@PathVariable Long id) {
        List<ReadinessQuestion> questions = placementReadinessService.getQuestions(id);
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/resources/{id}")
    public ResponseEntity<List<ReadinessResource>> getResources(@PathVariable Long id) {
        List<ReadinessResource> resources = placementReadinessService.getResources(id);
        return ResponseEntity.ok(resources);
    }

    @GetMapping("/roadmap/{id}")
    public ResponseEntity<List<Map<String, Object>>> getRoadmap(@PathVariable Long id) {
        List<Map<String, Object>> roadmap = placementReadinessService.getRoadmap(id);
        return ResponseEntity.ok(roadmap);
    }

    @PostMapping("/refresh/{id}")
    public ResponseEntity<Map<String, Object>> refreshReadinessPlan(@PathVariable Long id) {
        Map<String, Object> guide = placementReadinessService.refreshReadinessPlan(id);
        return ResponseEntity.ok(guide);
    }
}
