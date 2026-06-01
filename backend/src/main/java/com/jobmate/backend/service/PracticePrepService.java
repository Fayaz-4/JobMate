package com.jobmate.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobmate.backend.entity.ExtractedProfile;
import com.jobmate.backend.entity.User;
import com.jobmate.backend.exception.ResourceNotFoundException;
import com.jobmate.backend.repository.ExtractedProfileRepository;
import com.jobmate.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PracticePrepService {

    private final UserRepository userRepository;
    private final ExtractedProfileRepository extractedProfileRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public Map<String, Object> getStatus(String email) {
        boolean hasResume = extractedProfileRepository.findByUserEmailIgnoreCase(email).isPresent();
        Map<String, Object> status = new HashMap<>();
        status.put("hasResume", hasResume);
        return status;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getLeetCodeRoadmap(String email) {
        ExtractedProfile profile = extractedProfileRepository.findByUserEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Please upload a resume first to unlock dynamic LeetCode recommendations."));

        String skills = profile.getSkills() != null ? profile.getSkills() : "";
        String projects = profile.getProjects() != null ? profile.getProjects() : "";

        log.info("Generating dynamic LeetCode roadmap for user: {}", email);
        String rawJson = geminiService.generatePersonalizedLeetCodeRoadmap(skills, projects);
        return parseJsonSafely(rawJson);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMockInterviewPrep(String email) {
        ExtractedProfile profile = extractedProfileRepository.findByUserEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Please upload a resume first to unlock dynamic Google AI Studio mock prep."));

        String skills = profile.getSkills() != null ? profile.getSkills() : "";
        String projects = profile.getProjects() != null ? profile.getProjects() : "";
        String experience = profile.getExperience() != null ? profile.getExperience() : "";
        String education = profile.getEducation() != null ? profile.getEducation() : "";

        log.info("Generating dynamic Google AI Studio mock prep context for user: {}", email);
        String rawJson = geminiService.generatePersonalizedMockInterviewContext(skills, projects, experience, education);
        return parseJsonSafely(rawJson);
    }

    private Map<String, Object> parseJsonSafely(String rawJson) {
        if (rawJson == null) return new HashMap<>();
        try {
            String clean = rawJson.trim();
            if (clean.startsWith("```")) {
                int firstNewLine = clean.indexOf('\n');
                if (firstNewLine != -1) {
                    clean = clean.substring(firstNewLine).trim();
                }
                if (clean.endsWith("```")) {
                    clean = clean.substring(0, clean.length() - 3).trim();
                }
            }
            return objectMapper.readValue(clean, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse JSON string. Raw value: {}", rawJson, e);
            return new HashMap<>();
        }
    }
}
