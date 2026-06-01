package com.jobmate.backend.service;

import com.jobmate.backend.entity.*;
import com.jobmate.backend.repository.*;
import com.jobmate.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlacementReadinessService {

    private final ApplicationRepository applicationRepository;
    private final PlacementReadinessRepository placementReadinessRepository;
    private final GeminiService geminiService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAppliedCompanies(String email) {
        List<Application> applications = applicationRepository.findAllByUserEmailIgnoreCaseOrderByLastUpdatedDesc(email);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Application app : applications) {
            Map<String, Object> card = new HashMap<>();
            card.put("id", app.getId());
            card.put("companyName", app.getCompanyName());
            card.put("role", app.getJobTitle());
            card.put("status", app.getStatus());
            card.put("appliedDate", app.getAppliedDate());
            card.put("logo", app.getCompanyName().substring(0, 1).toUpperCase());
            card.put("readinessCompanyId", app.getId());
            
            Job job = app.getJob();
            card.put("location", job != null ? job.getLocation() : "Remote");
            card.put("skills", job != null && job.getSkillsRequired() != null ? job.getSkillsRequired() : "");
            result.add(card);
        }

        return result;
    }

    @Transactional
    public PlacementReadiness getOrCreateReadiness(Long applicationId) {
        return placementReadinessRepository.findByApplicationId(applicationId)
                .orElseGet(() -> {
                    Application app = applicationRepository.findById(applicationId)
                            .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + applicationId));

                    String companyName = app.getCompanyName();
                    String jobTitle = app.getJobTitle();
                    Job job = app.getJob();
                    String jobDescription = job != null ? job.getDescription() : "";
                    String skillsRequired = job != null ? job.getSkillsRequired() : "";
                    String employmentType = job != null ? job.getEmploymentType() : "Full-time";
                    String location = job != null ? job.getLocation() : "Remote";

                    log.info("No cached placement readiness found for application {}. Generating via Gemini API.", applicationId);
                    Map<String, String> aiResult = geminiService.generatePlacementReadiness(companyName, jobTitle, jobDescription, skillsRequired, employmentType, location);
                    String aiResponse = aiResult.get("aiResponse");
                    String researchData = aiResult.get("researchData");

                    PlacementReadiness newReadiness = PlacementReadiness.builder()
                            .userId(app.getUser().getId())
                            .applicationId(applicationId)
                            .companyName(companyName)
                            .jobTitle(jobTitle)
                            .aiResponse(aiResponse)
                            .researchData(researchData)
                            .createdAt(LocalDateTime.now())
                            .build();

                    try {
                        return placementReadinessRepository.save(newReadiness);
                    } catch (org.springframework.dao.DataIntegrityViolationException dive) {
                        log.warn("PlacementReadiness duplicate key during parallel save for application ID: {}. Returning existing record.", applicationId);
                        return placementReadinessRepository.findByApplicationId(applicationId)
                                .orElseThrow(() -> new ResourceNotFoundException("PlacementReadiness not found after parallel save conflict."));
                    }
                });
    }

    @Transactional
    public Map<String, Object> refreshReadinessPlan(Long applicationId) {
        log.info("Refreshing placement readiness plan for application ID: {}", applicationId);
        placementReadinessRepository.findByApplicationId(applicationId).ifPresent(record -> {
            placementReadinessRepository.delete(record);
            placementReadinessRepository.flush();
        });

        getOrCreateReadiness(applicationId);
        return getCompanyGuide(applicationId);
    }

    @Transactional
    public Map<String, Object> getCompanyGuide(Long applicationId) {
        return getCompanyGuideInternal(applicationId);
    }

    @Transactional
    public Map<String, Object> getCompanyGuideInternal(Long applicationId) {
        PlacementReadiness readiness = getOrCreateReadiness(applicationId);
        Map<String, Object> parsed = parseAiResponse(readiness.getAiResponse());

        String companyName = parsed.containsKey("companyName") ? (String) parsed.get("companyName") : readiness.getCompanyName();
        String role = parsed.containsKey("role") ? (String) parsed.get("role") : readiness.getJobTitle();
        String difficulty = parsed.containsKey("difficulty") ? (String) parsed.get("difficulty") : "Medium";
        String prepTime = parsed.containsKey("estimatedPreparationTime") ? (String) parsed.get("estimatedPreparationTime") : "30 Days";

        ReadinessCompany dummyCompany = ReadinessCompany.builder()
                .id(applicationId)
                .companyName(companyName)
                .role(role)
                .difficulty(difficulty)
                .estimatedPreparationTime(prepTime)
                .build();

        List<ReadinessTopic> topicList = new ArrayList<>();
        Map<String, Object> topicsMap = (Map<String, Object>) parsed.get("topics");
        long idCounter = 1L;
        if (topicsMap != null) {
            for (Map.Entry<String, Object> entry : topicsMap.entrySet()) {
                String category = entry.getKey();
                if (entry.getValue() instanceof List) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) entry.getValue();
                    if (list != null) {
                        for (Map<String, Object> item : list) {
                            topicList.add(ReadinessTopic.builder()
                                    .id(idCounter++)
                                    .company(dummyCompany)
                                    .topicCategory(category)
                                    .topicName((String) item.get("topicName"))
                                    .difficulty((String) item.get("difficulty"))
                                    .frequency((String) item.get("frequency"))
                                    .build());
                        }
                    }
                }
            }
        }

        Map<String, List<ReadinessTopic>> groupedTopics = topicList.stream()
                .collect(Collectors.groupingBy(ReadinessTopic::getTopicCategory));

        Map<String, Object> guide = new HashMap<>();
        guide.put("id", dummyCompany.getId());
        guide.put("companyName", dummyCompany.getCompanyName());
        guide.put("role", dummyCompany.getRole());
        guide.put("difficulty", dummyCompany.getDifficulty());
        guide.put("estimatedPreparationTime", dummyCompany.getEstimatedPreparationTime());
        guide.put("topics", groupedTopics);

        // Parse and include interview rounds with full RAG detail (focus, description, howToPrepare, crackingTips)
        try {
            List<Map<String, Object>> parsedRounds = (List<Map<String, Object>>) parsed.get("interviewRounds");
            if (parsedRounds == null || parsedRounds.isEmpty()) {
                parsedRounds = (List<Map<String, Object>>) parsed.get("hiringProcess");
            }
            guide.put("interviewRounds", parsedRounds != null ? parsedRounds : new ArrayList<>());
        } catch (Exception e) {
            log.error("Failed to parse interviewRounds from aiResponse", e);
            guide.put("interviewRounds", new ArrayList<>());
        }

        // Deserialize and include RAG research metadata crawled webpage chunks
        try {
            if (readiness.getResearchData() != null && !readiness.getResearchData().trim().isEmpty()) {
                guide.put("researchData", objectMapper.readValue(readiness.getResearchData(), Map.class));
            } else {
                guide.put("researchData", new HashMap<>());
            }
        } catch (Exception e) {
            log.error("Failed to parse research data", e);
            guide.put("researchData", new HashMap<>());
        }

        guide.put("aiResponse", readiness.getAiResponse());

        return guide;
    }

    @Transactional
    public List<ReadinessRound> getHiringProcess(Long applicationId) {
        PlacementReadiness readiness = getOrCreateReadiness(applicationId);
        Map<String, Object> parsed = parseAiResponse(readiness.getAiResponse());

        String companyName = parsed.containsKey("companyName") ? (String) parsed.get("companyName") : readiness.getCompanyName();
        String role = parsed.containsKey("role") ? (String) parsed.get("role") : readiness.getJobTitle();
        String difficulty = parsed.containsKey("difficulty") ? (String) parsed.get("difficulty") : "Medium";
        String prepTime = parsed.containsKey("estimatedPreparationTime") ? (String) parsed.get("estimatedPreparationTime") : "30 Days";

        ReadinessCompany dummyCompany = ReadinessCompany.builder()
                .id(applicationId)
                .companyName(companyName)
                .role(role)
                .difficulty(difficulty)
                .estimatedPreparationTime(prepTime)
                .build();

        List<ReadinessRound> rounds = new ArrayList<>();
        List<Map<String, Object>> roundsList = (List<Map<String, Object>>) parsed.get("interviewRounds");
        if (roundsList == null || roundsList.isEmpty()) {
            roundsList = (List<Map<String, Object>>) parsed.get("hiringProcess");
        }
        long idCounter = 1L;
        if (roundsList != null) {
            for (Map<String, Object> item : roundsList) {
                Object roundOrderObj = item.get("roundOrder");
                int roundOrder = 1;
                if (roundOrderObj instanceof Number) {
                    roundOrder = ((Number) roundOrderObj).intValue();
                } else if (roundOrderObj instanceof String) {
                    try {
                        roundOrder = Integer.parseInt((String) roundOrderObj);
                    } catch (NumberFormatException ignored) {}
                }
                rounds.add(ReadinessRound.builder()
                        .id(idCounter++)
                        .company(dummyCompany)
                        .roundName((String) item.get("roundName"))
                        .roundOrder(roundOrder)
                        .build());
            }
        }

        return rounds;
    }

    @Transactional
    public List<ReadinessQuestion> getQuestions(Long applicationId) {
        PlacementReadiness readiness = getOrCreateReadiness(applicationId);
        Map<String, Object> parsed = parseAiResponse(readiness.getAiResponse());

        String companyName = parsed.containsKey("companyName") ? (String) parsed.get("companyName") : readiness.getCompanyName();
        String role = parsed.containsKey("role") ? (String) parsed.get("role") : readiness.getJobTitle();
        String difficulty = parsed.containsKey("difficulty") ? (String) parsed.get("difficulty") : "Medium";
        String prepTime = parsed.containsKey("estimatedPreparationTime") ? (String) parsed.get("estimatedPreparationTime") : "30 Days";

        ReadinessCompany dummyCompany = ReadinessCompany.builder()
                .id(applicationId)
                .companyName(companyName)
                .role(role)
                .difficulty(difficulty)
                .estimatedPreparationTime(prepTime)
                .build();

        List<ReadinessQuestion> questions = new ArrayList<>();
        List<Map<String, Object>> questionsList = (List<Map<String, Object>>) parsed.get("questions");
        long idCounter = 1L;
        if (questionsList != null && !questionsList.isEmpty()) {
            for (Map<String, Object> item : questionsList) {
                questions.add(ReadinessQuestion.builder()
                        .id(idCounter++)
                        .company(dummyCompany)
                        .question((String) item.get("question"))
                        .roundType((String) item.get("roundType"))
                        .difficulty((String) item.get("difficulty"))
                        .build());
            }
        } else {
            List<String> hr = (List<String>) parsed.get("hrQuestions");
            if (hr != null) {
                for (String q : hr) {
                    questions.add(ReadinessQuestion.builder().id(idCounter++).company(dummyCompany).question(q).roundType("HR").difficulty("Easy").build());
                }
            }
            List<String> tech = (List<String>) parsed.get("technicalQuestions");
            if (tech != null) {
                for (String q : tech) {
                    questions.add(ReadinessQuestion.builder().id(idCounter++).company(dummyCompany).question(q).roundType("Technical").difficulty("Medium").build());
                }
            }
            List<String> beh = (List<String>) parsed.get("behavioralQuestions");
            if (beh != null) {
                for (String q : beh) {
                    questions.add(ReadinessQuestion.builder().id(idCounter++).company(dummyCompany).question(q).roundType("HR").difficulty("Medium").build());
                }
            }
        }

        return questions;
    }

    @Transactional
    public List<ReadinessResource> getResources(Long applicationId) {
        PlacementReadiness readiness = getOrCreateReadiness(applicationId);
        Map<String, Object> parsed = parseAiResponse(readiness.getAiResponse());

        String companyName = parsed.containsKey("companyName") ? (String) parsed.get("companyName") : readiness.getCompanyName();
        String role = parsed.containsKey("role") ? (String) parsed.get("role") : readiness.getJobTitle();
        String difficulty = parsed.containsKey("difficulty") ? (String) parsed.get("difficulty") : "Medium";
        String prepTime = parsed.containsKey("estimatedPreparationTime") ? (String) parsed.get("estimatedPreparationTime") : "30 Days";

        ReadinessCompany dummyCompany = ReadinessCompany.builder()
                .id(applicationId)
                .companyName(companyName)
                .role(role)
                .difficulty(difficulty)
                .estimatedPreparationTime(prepTime)
                .build();

        List<ReadinessResource> resources = new ArrayList<>();
        List<Map<String, Object>> resourcesList = (List<Map<String, Object>>) parsed.get("resources");
        long idCounter = 1L;
        if (resourcesList != null) {
            for (Map<String, Object> item : resourcesList) {
                resources.add(ReadinessResource.builder()
                        .id(idCounter++)
                        .company(dummyCompany)
                        .resourceName((String) item.get("resourceName"))
                        .resourceUrl((String) item.get("resourceUrl"))
                        .resourceType((String) item.get("resourceType"))
                        .build());
            }
        }

        return resources;
    }

    @Transactional
    public List<Map<String, Object>> getRoadmap(Long applicationId) {
        PlacementReadiness readiness = getOrCreateReadiness(applicationId);
        Map<String, Object> parsed = parseAiResponse(readiness.getAiResponse());

        List<Map<String, Object>> roadmap = new ArrayList<>();
        List<Map<String, Object>> roadmapList = (List<Map<String, Object>>) parsed.get("roadmap");
        if (roadmapList != null) {
            for (Map<String, Object> item : roadmapList) {
                Map<String, Object> map = new HashMap<>();
                map.put("week", item.get("week"));
                map.put("topics", item.get("topics"));
                map.put("resources", item.get("resources"));
                roadmap.add(map);
            }
        } else {
            List<Map<String, Object>> timeline = (List<Map<String, Object>>) parsed.get("preparationTimeline");
            if (timeline != null) {
                for (Map<String, Object> item : timeline) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("week", item.get("day"));
                    map.put("topics", item.get("tasks"));
                    map.put("resources", "Review core guidelines and references.");
                    roadmap.add(map);
                }
            }
        }

        return roadmap;
    }

    private Map<String, Object> parseAiResponse(String aiResponse) {
        try {
            if (aiResponse == null) return new HashMap<>();
            String cleanJson = aiResponse.trim();
            if (cleanJson.startsWith("```")) {
                int firstNewLine = cleanJson.indexOf('\n');
                if (firstNewLine != -1) {
                    cleanJson = cleanJson.substring(firstNewLine).trim();
                }
                if (cleanJson.endsWith("```")) {
                    cleanJson = cleanJson.substring(0, cleanJson.length() - 3).trim();
                }
            }
            return objectMapper.readValue(cleanJson, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse AI response JSON. Raw output: {}", aiResponse, e);
            return new HashMap<>();
        }
    }
}
