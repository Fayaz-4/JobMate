package com.jobmate.backend.controller;

import com.jobmate.backend.dto.ExtractionResponse;
import com.jobmate.backend.dto.SkillResponse;
import com.jobmate.backend.service.SkillExtractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/extraction")
@RequiredArgsConstructor
public class SkillExtractionController {

    private final SkillExtractionService skillExtractionService;

    @PostMapping("/process/{resumeId}")
    public ResponseEntity<ExtractionResponse> processResume(@PathVariable Long resumeId, Principal principal) {
        ExtractionResponse response = skillExtractionService.extractResume(resumeId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<ExtractionResponse> getExtractedProfile(Principal principal) {
        ExtractionResponse response = skillExtractionService.getExtractedProfile(principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/skills")
    public ResponseEntity<SkillResponse> getExtractedSkills(Principal principal) {
        SkillResponse response = skillExtractionService.getExtractedSkills(principal.getName());
        return ResponseEntity.ok(response);
    }
}
