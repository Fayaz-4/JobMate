package com.jobmate.backend.controller;

import com.jobmate.backend.service.PracticePrepService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/practice-prep")
@RequiredArgsConstructor
public class PracticePrepController {

    private final PracticePrepService practicePrepService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(Principal principal) {
        return ResponseEntity.ok(practicePrepService.getStatus(principal.getName()));
    }

    @GetMapping("/leetcode")
    public ResponseEntity<Map<String, Object>> getLeetCodeRoadmap(Principal principal) {
        return ResponseEntity.ok(practicePrepService.getLeetCodeRoadmap(principal.getName()));
    }

    @GetMapping("/ai-studio")
    public ResponseEntity<Map<String, Object>> getMockInterviewPrep(Principal principal) {
        return ResponseEntity.ok(practicePrepService.getMockInterviewPrep(principal.getName()));
    }
}
