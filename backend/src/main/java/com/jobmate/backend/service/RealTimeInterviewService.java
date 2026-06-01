package com.jobmate.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobmate.backend.entity.*;
import com.jobmate.backend.exception.ResourceNotFoundException;
import com.jobmate.backend.repository.*;
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
public class RealTimeInterviewService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final ApplicationRepository applicationRepository;
    private final PlacementReadinessRepository placementReadinessRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewQuestionRepository interviewQuestionRepository;
    private final ExtractedProfileRepository extractedProfileRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Value("${vapi.private.key:}")
    private String vapiPrivateKey;

    private static final int TOTAL_QUESTIONS_PER_SESSION = 5;

    private List<String> getExcludedQuestionsForUser(String email) {
        List<String> excluded = new ArrayList<>();
        try {
            List<InterviewSession> sessions = interviewSessionRepository.findAllByUserEmailIgnoreCaseOrderByCreatedAtDesc(email);
            for (InterviewSession s : sessions) {
                List<InterviewQuestion> questions = interviewQuestionRepository.findAllBySessionIdOrderByCreatedAtAsc(s.getId());
                for (String qText : questions.stream().map(InterviewQuestion::getQuestion).filter(Objects::nonNull).map(String::trim).collect(Collectors.toList())) {
                    if (!qText.isEmpty()) {
                        excluded.add(qText);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to load past excluded questions", e);
        }
        return excluded;
    }

    private String getDynamicFallbackQuestion(String email) {
        try {
            ExtractedProfile profile = extractedProfileRepository.findByUserEmailIgnoreCase(email).orElse(null);
            if (profile != null && profile.getSkills() != null && !profile.getSkills().trim().isEmpty()) {
                String[] skillsList = profile.getSkills().split(",");
                String skill = skillsList[new Random().nextInt(skillsList.length)].trim();
                return String.format("Let's talk about your technical stack. How have you used %s in your projects, and what are some best practices you followed?", skill);
            } else {
                String[] generalTopics = {"REST API design", "caching layers using Redis", "relational database indexing", "CI/CD automated pipeline integrations", "microservices communication"};
                String topic = generalTopics[new Random().nextInt(generalTopics.length)];
                return String.format("Could you walk me through your engineering experience implementing %s, and how you ensured high performance and reliability?", topic);
            }
        } catch (Exception ignored) {}
        return "Could you walk me through your engineering experience implementing REST API design, and how you ensured high performance and reliability?";
    }

    private String getDynamicFirstQuestionFallback(String email, String role, String company) {
        try {
            ExtractedProfile profile = extractedProfileRepository.findByUserEmailIgnoreCase(email).orElse(null);
            if (profile != null && profile.getSkills() != null && !profile.getSkills().trim().isEmpty()) {
                String[] skillsList = profile.getSkills().split(",");
                String skill = skillsList[new Random().nextInt(skillsList.length)].trim();
                return String.format("To begin, I see you have experience with %s. How would you apply this technology in the context of the %s role at %s?", skill, role, company);
            } else {
                String[] interviewTracks = {"collaborative system design", "performance tuning of backend architectures", "component modularity and testing"};
                String track = interviewTracks[new Random().nextInt(interviewTracks.length)];
                return String.format("To begin our interview, could you walk me through your expertise in %s, and how you plan to leverage that in your role as a %s at %s?", track, role, company);
            }
        } catch (Exception ignored) {}
        return String.format("To begin our interview, could you walk me through your expertise in collaborative system design, and how you plan to leverage that in your role as a %s at %s?", role, company);
    }


    private String buildSystemPrompt(
            String candidateName,
            String companyName,
            String role,
            String jobDescription,
            String skillsRequired,
            String interviewType,
            String resumeSkills,
            String resumeProjects,
            String resumeExpEdu,
            List<String> excludedQuestions
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are Rachel, a highly professional, friendly, and expert technical recruiter/coach. You are conducting a live real-time voice-interactive interview with candidate '").append(candidateName).append("'.\n\n");
        
        sb.append("Your voice is powered by ElevenLabs, so keep your responses highly conversational, concise, natural, and friendly. Avoid extremely long blocks of text; ask one question at a time and wait for the candidate to respond. Speak clearly and empathetically.\n\n");

        if ("Mixed".equalsIgnoreCase(interviewType)) {
            sb.append("INTERVIEW MODE: MIXED INTERVIEW.\n");
            sb.append("Instructions: Formulate questions dynamically, merging details from BOTH the candidate's resume (skills, projects, experience, education) and the company job description/role requirements.\n");
            sb.append("- Resume Skills: ").append(resumeSkills).append("\n");
            sb.append("- Resume Projects: ").append(resumeProjects).append("\n");
            sb.append("- Resume Experience & Education: ").append(resumeExpEdu).append("\n");
            sb.append("- Company: ").append(companyName).append("\n");
            sb.append("- Role: ").append(role).append("\n");
            sb.append("- Required Skills: ").append(skillsRequired).append("\n");
            sb.append("- Job Description: ").append(jobDescription).append("\n\n");
        } else if ("Resume Based".equalsIgnoreCase(interviewType) || "Google AI Studio".equalsIgnoreCase(companyName)) {
            sb.append("INTERVIEW MODE: RESUME-BASED INTERVIEW.\n");
            sb.append("Instructions: Formulate questions STRICTLY AND ONLY from the actual resume content (skills, projects, experience, education). Do NOT ask any company-specific questions or questions about tools/technologies not on the candidate's resume.\n");
            sb.append("- Resume Skills: ").append(resumeSkills).append("\n");
            sb.append("- Resume Projects: ").append(resumeProjects).append("\n");
            sb.append("- Resume Experience & Education: ").append(resumeExpEdu).append("\n\n");
        } else {
            sb.append("INTERVIEW MODE: COMPANY-SPECIFIC INTERVIEW.\n");
            sb.append("Instructions: Formulate questions STRICTLY targeting the company '").append(companyName).append("', the role '").append(role).append("', the job description, and the required skills. Do NOT ask questions about the candidate's specific resume projects unless they relate directly to the job description.\n");
            sb.append("- Company: ").append(companyName).append("\n");
            sb.append("- Role: ").append(role).append("\n");
            sb.append("- Required Skills: ").append(skillsRequired).append("\n");
            sb.append("- Job Description: ").append(jobDescription).append("\n\n");
        }

        if (excludedQuestions != null && !excludedQuestions.isEmpty()) {
            sb.append("CRITICAL EXCLUSIONS:\n");
            sb.append("You MUST NOT ask any of the following questions that the candidate was already asked in previous or current sessions:\n");
            for (String q : excludedQuestions) {
                sb.append("- \"").append(q).append("\"\n");
            }
            sb.append("\n");
        }

        sb.append("ADAPTATION & CONVERSATION RULES:\n");
        sb.append("1. Be dynamic, conversational, and natural. Do NOT read from a template or use predefined question lists.\n");
        sb.append("2. Adapt your tone and difficulty level (Easy, Medium, Hard) depending on the correctness, detail level, and confidence of the candidate's response. Start with a warm, welcoming Easy question, and then step up the difficulty if they perform well, or soften if they struggle.\n");
        sb.append("3. Ask deep technical follow-up questions when the candidate mentions specific technologies (e.g., Spring Boot security, performance bottlenecks, caching, database indexing, APIs).\n");
        sb.append("4. Aim to ask exactly 5 substantive questions in total. Keep track of the conversation flow. Once the candidate has finished answering your 5th question, let them know that the interview is complete, thank them warmly for their time, wish them the best, and politely say goodbye. Do not continue asking questions after the 5th response.\n");

        return sb.toString();
    }

    private Map<String, Object> fetchVapiCallDetails(String callId) {
        if (vapiPrivateKey == null || vapiPrivateKey.trim().isEmpty()) {
            log.error("Vapi private key is missing. Unable to fetch call details.");
            return null;
        }
        String url = "https://api.vapi.ai/call/" + callId;
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", "Bearer " + vapiPrivateKey.trim());
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.ResponseEntity<Map> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Failed to fetch Vapi call details for callId: {}", callId, e);
        }
        return null;
    }

    @Transactional
    public Map<String, Object> startSession(String email, Long applicationId, String interviewType) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + applicationId));

        String candidateName = profileRepository.findByUserEmailIgnoreCase(email)
                .map(Profile::getFullName)
                .orElse(user.getFullName());

        String companyName = app.getCompanyName();
        String jobTitle = app.getJobTitle();
        Job job = app.getJob();
        String jobDescription = job != null ? job.getDescription() : "";
        String skillsRequired = job != null ? job.getSkillsRequired() : "";

        String readinessData = placementReadinessRepository.findByApplicationId(applicationId)
                .map(PlacementReadiness::getAiResponse)
                .orElse("");

        ExtractedProfile profile = extractedProfileRepository.findByUserEmailIgnoreCase(email).orElse(null);
        String resumeSkills = profile != null && profile.getSkills() != null ? profile.getSkills() : "";
        String resumeProjects = profile != null && profile.getProjects() != null ? profile.getProjects() : "";
        StringBuilder sb = new StringBuilder();
        if (profile != null) {
            if (profile.getExperience() != null) sb.append("Experience: ").append(profile.getExperience()).append("\n");
            if (profile.getEducation() != null) sb.append("Education: ").append(profile.getEducation()).append("\n");
            if (profile.getKeywords() != null) sb.append("Keywords: ").append(profile.getKeywords()).append("\n");
        }
        String resumeExpEdu = sb.toString();

        List<String> excludedQuestions = getExcludedQuestionsForUser(email);

        log.info("Starting Real-Time Vapi AI Interview Session for Candidate: {}, Company: {}, Role: {}", 
                candidateName, companyName, jobTitle);

        int decidedDuration = 30;
        String introSpeech = String.format("Hello %s. I am Rachel, your virtual AI Recruiter coach today. We are going to conduct a dynamic %s interview tailored to the %s position at %s. Let's begin. Could you please introduce yourself and tell me what technical stack you enjoy working with most?",
                candidateName, interviewType, jobTitle, companyName);

        // Initialize session in database
        InterviewSession session = InterviewSession.builder()
                .user(user)
                .application(app)
                .companyName(companyName)
                .jobTitle(jobTitle)
                .interviewType(interviewType)
                .duration(decidedDuration)
                .status("IN_PROGRESS")
                .createdAt(LocalDateTime.now())
                .build();

        InterviewSession savedSession = interviewSessionRepository.save(session);

        // Build the dynamic Vapi inline configuration object
        Map<String, Object> vapiAssistantConfig = new HashMap<>();
        
        Map<String, Object> transcriber = new HashMap<>();
        transcriber.put("provider", "deepgram");
        transcriber.put("model", "nova-2");
        transcriber.put("language", "en-US");
        vapiAssistantConfig.put("transcriber", transcriber);

        Map<String, Object> model = new HashMap<>();
        model.put("provider", "openai");
        model.put("model", "gpt-4o");
        model.put("temperature", 0.7);
        
        String systemPrompt = buildSystemPrompt(candidateName, companyName, jobTitle, jobDescription, skillsRequired, interviewType, resumeSkills, resumeProjects, resumeExpEdu, excludedQuestions);
        model.put("systemPrompt", systemPrompt);
        vapiAssistantConfig.put("model", model);

        Map<String, Object> voice = new HashMap<>();
        voice.put("provider", "11labs");
        voice.put("voiceId", "21m00Tcm4TlvDq8ikWAM"); // ElevenLabs Rachel
        vapiAssistantConfig.put("voice", voice);

        vapiAssistantConfig.put("firstMessage", introSpeech);

        Map<String, Object> payload = new HashMap<>();
        payload.put("sessionId", savedSession.getId());
        payload.put("companyName", companyName);
        payload.put("jobTitle", jobTitle);
        payload.put("interviewType", interviewType);
        payload.put("duration", decidedDuration);
        payload.put("introSpeech", introSpeech);
        payload.put("firstQuestion", "Please introduce yourself.");
        payload.put("questionNumber", 1);
        payload.put("totalQuestions", TOTAL_QUESTIONS_PER_SESSION);
        payload.put("difficulty", "Easy");
        payload.put("vapiAssistantConfig", vapiAssistantConfig);

        return payload;
    }

    @Transactional
    public Map<String, Object> startResumeMockSession(String email, String interviewType) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        ExtractedProfile profile = extractedProfileRepository.findByUserEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Please upload a resume first to extract skills and projects."));

        String candidateName = profileRepository.findByUserEmailIgnoreCase(email)
                .map(Profile::getFullName)
                .orElse(user.getFullName());

        String companyName = "Google AI Studio";
        String jobTitle = "Resume-Based Mock Interview (" + interviewType + ")";
        String skillsRequired = profile.getSkills() != null ? profile.getSkills() : "";
        
        StringBuilder resumeDetails = new StringBuilder();
        if (profile.getProjects() != null) {
            resumeDetails.append("Projects: ").append(profile.getProjects()).append("\n");
        }
        if (profile.getExperience() != null) {
            resumeDetails.append("Experience: ").append(profile.getExperience()).append("\n");
        }
        if (profile.getEducation() != null) {
            resumeDetails.append("Education: ").append(profile.getEducation()).append("\n");
        }
        String jobDescription = resumeDetails.toString();

        String resumeSkills = profile.getSkills() != null ? profile.getSkills() : "";
        String resumeProjects = profile.getProjects() != null ? profile.getProjects() : "";
        StringBuilder sbExp = new StringBuilder();
        if (profile.getExperience() != null) sbExp.append("Experience: ").append(profile.getExperience()).append("\n");
        if (profile.getEducation() != null) sbExp.append("Education: ").append(profile.getEducation()).append("\n");
        String resumeExpEdu = sbExp.toString();

        List<String> excludedQuestions = getExcludedQuestionsForUser(email);

        log.info("Starting Resume-Based Vapi AI Mock Interview Session for Candidate: {}, Focus: {}", 
                candidateName, interviewType);

        int decidedDuration = 30;
        String introSpeech = String.format("Hello %s. Welcome to your Google AI Studio resume-based mock interview. Today, we will conduct a customized %s interview tailored to your skills and projects. Let's begin. Could you please introduce yourself and tell me what technical stack you enjoy working with most?", 
                candidateName, interviewType);

        InterviewSession session = InterviewSession.builder()
                .user(user)
                .application(null)
                .companyName(companyName)
                .jobTitle(jobTitle)
                .interviewType(interviewType)
                .duration(decidedDuration)
                .status("IN_PROGRESS")
                .createdAt(LocalDateTime.now())
                .build();

        InterviewSession savedSession = interviewSessionRepository.save(session);

        // Build the dynamic Vapi inline configuration object
        Map<String, Object> vapiAssistantConfig = new HashMap<>();
        
        Map<String, Object> transcriber = new HashMap<>();
        transcriber.put("provider", "deepgram");
        transcriber.put("model", "nova-2");
        transcriber.put("language", "en-US");
        vapiAssistantConfig.put("transcriber", transcriber);

        Map<String, Object> model = new HashMap<>();
        model.put("provider", "openai");
        model.put("model", "gpt-4o");
        model.put("temperature", 0.7);
        
        String systemPrompt = buildSystemPrompt(candidateName, companyName, jobTitle, jobDescription, skillsRequired, interviewType, resumeSkills, resumeProjects, resumeExpEdu, excludedQuestions);
        model.put("systemPrompt", systemPrompt);
        vapiAssistantConfig.put("model", model);

        Map<String, Object> voice = new HashMap<>();
        voice.put("provider", "11labs");
        voice.put("voiceId", "21m00Tcm4TlvDq8ikWAM"); // ElevenLabs Rachel
        vapiAssistantConfig.put("voice", voice);

        vapiAssistantConfig.put("firstMessage", introSpeech);

        Map<String, Object> payload = new HashMap<>();
        payload.put("sessionId", savedSession.getId());
        payload.put("companyName", companyName);
        payload.put("jobTitle", jobTitle);
        payload.put("interviewType", interviewType);
        payload.put("duration", decidedDuration);
        payload.put("introSpeech", introSpeech);
        payload.put("firstQuestion", "Please introduce yourself.");
        payload.put("questionNumber", 1);
        payload.put("totalQuestions", TOTAL_QUESTIONS_PER_SESSION);
        payload.put("difficulty", "Easy");
        payload.put("vapiAssistantConfig", vapiAssistantConfig);

        return payload;
    }

    @Transactional
    public Map<String, Object> submitAnswer(Long sessionId, String questionText, String userAnswer) {
        // Keep this method for compilation compatibility with other layers
        InterviewSession session = interviewSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found with ID: " + sessionId));

        Map<String, Object> result = new HashMap<>();
        result.put("score", 100);
        result.put("isFinished", true);
        result.put("nextQuestion", "");
        result.put("nextDifficulty", "Medium");
        result.put("questionNumber", 1);
        result.put("totalQuestions", TOTAL_QUESTIONS_PER_SESSION);
        return result;
    }

    @Transactional
    public Map<String, Object> endSession(Long sessionId) {
        return endSession(sessionId, null);
    }

    @Transactional
    public Map<String, Object> endSession(Long sessionId, String vapiCallId) {
        InterviewSession session = interviewSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));

        log.info("Ending session ID: {} with Vapi Call ID: {}", sessionId, vapiCallId);

        String transcript = null;
        int durationSecs = 0;

        if (vapiCallId != null && !vapiCallId.trim().isEmpty()) {
            Map<String, Object> callDetails = fetchVapiCallDetails(vapiCallId);
            if (callDetails != null) {
                transcript = (String) callDetails.get("transcript");
                if (callDetails.get("duration") instanceof Number) {
                    durationSecs = ((Number) callDetails.get("duration")).intValue();
                }
            }
        }

        // Apply Data-Integrity Guards
        if (transcript == null || transcript.trim().isEmpty()) {
            // Missing Transcript
            log.warn("Transcript is missing for session ID: {}. Applying missing transcript guard.", sessionId);
            session.setOverallScore(0);
            session.setTechnicalScore(0);
            session.setCommunicationScore(0);
            session.setConfidenceScore(0);
            session.setBehavioralScore(0);
            session.setProblemSolvingScore(0);
            
            try {
                session.setStrengths(objectMapper.writeValueAsString(Arrays.asList("Evaluation unavailable.")));
                session.setWeaknesses(objectMapper.writeValueAsString(Arrays.asList("Evaluation unavailable.")));
                
                Map<String, Object> timelinePlan = new HashMap<>();
                timelinePlan.put("topicsToRevise", Arrays.asList("Evaluation unavailable."));
                timelinePlan.put("practiceAreas", Arrays.asList("Evaluation unavailable."));
                timelinePlan.put("learningRecommendations", "Evaluation unavailable.");
                session.setImprovementPlan(objectMapper.writeValueAsString(timelinePlan));
            } catch (Exception ignored) {}

            session.setTranscript("Evaluation unavailable.");
            session.setStatus("COMPLETED");
            interviewSessionRepository.save(session);

            // Clean up any dummy questions
            List<InterviewQuestion> dummyQuestions = interviewQuestionRepository.findAllBySessionIdOrderByCreatedAtAsc(sessionId);
            interviewQuestionRepository.deleteAllInBatch(dummyQuestions);
            
            InterviewQuestion q = InterviewQuestion.builder()
                    .session(session)
                    .question("AI Voice Interview")
                    .userAnswer("Evaluation unavailable.")
                    .aiFeedback("Evaluation unavailable.")
                    .score(0)
                    .difficulty("Medium")
                    .createdAt(LocalDateTime.now())
                    .build();
            interviewQuestionRepository.save(q);

            return getSessionReportPayload(session);
        }

        if (transcript.length() < 120) {
            // Incomplete Transcript
            log.warn("Transcript is incomplete/too short for session ID: {}. Applying incomplete transcript guard.", sessionId);
            session.setOverallScore(0);
            session.setTechnicalScore(0);
            session.setCommunicationScore(0);
            session.setConfidenceScore(0);
            session.setBehavioralScore(0);
            session.setProblemSolvingScore(0);

            try {
                session.setStrengths(objectMapper.writeValueAsString(Arrays.asList("Not enough interview data for evaluation.")));
                session.setWeaknesses(objectMapper.writeValueAsString(Arrays.asList("Not enough interview data for evaluation.")));

                Map<String, Object> timelinePlan = new HashMap<>();
                timelinePlan.put("topicsToRevise", Arrays.asList("Not enough interview data for evaluation."));
                timelinePlan.put("practiceAreas", Arrays.asList("Not enough interview data for evaluation."));
                timelinePlan.put("learningRecommendations", "Not enough interview data for evaluation.");
                session.setImprovementPlan(objectMapper.writeValueAsString(timelinePlan));
            } catch (Exception ignored) {}

            session.setTranscript(transcript);
            session.setStatus("COMPLETED");
            interviewSessionRepository.save(session);

            // Clean up any dummy questions
            List<InterviewQuestion> dummyQuestions = interviewQuestionRepository.findAllBySessionIdOrderByCreatedAtAsc(sessionId);
            interviewQuestionRepository.deleteAllInBatch(dummyQuestions);

            InterviewQuestion q = InterviewQuestion.builder()
                    .session(session)
                    .question("AI Voice Interview")
                    .userAnswer(transcript)
                    .aiFeedback("Not enough interview data for evaluation.")
                    .score(0)
                    .difficulty("Medium")
                    .createdAt(LocalDateTime.now())
                    .build();
            interviewQuestionRepository.save(q);

            return getSessionReportPayload(session);
        }

        // Complete Transcript: Send to GPT-4o for structured analysis!
        log.info("Sending complete transcript to GPT-4o for evaluation report.");
        Map<String, Object> report = new HashMap<>();
        try {
            String userPrompt = String.format(
                "Evaluate this candidate voice interview transcript for the position:\n" +
                "Company: %s\n" +
                "Role: %s\n" +
                "Interview Type: %s\n\n" +
                "Transcript:\n%s\n\n" +
                "Generate a detailed, objective performance report. Zero fake data or placeholders. Only evaluate based on the actual conversation. Penalize heavily for excessive filler words or hesitation.\n" +
                "Your response must be a valid, parseable JSON object matching the exact structure below. Do not wrap in markdown or add comments. Return ONLY the raw JSON.\n\n" +
                "JSON Structure:\n" +
                "{\n" +
                "  \"overallScore\": 84, // integer out of 100\n" +
                "  \"technicalScore\": 85, // integer out of 100\n" +
                "  \"communicationScore\": 78, // integer out of 100\n" +
                "  \"confidenceScore\": 80, // integer out of 100\n" +
                "  \"behavioralScore\": 85, // integer out of 100\n" +
                "  \"problemSolvingScore\": 82, // integer out of 100\n" +
                "  \"strengths\": [ \"Strength 1\", \"Strength 2\" ],\n" +
                "  \"weaknesses\": [ \"Weakness 1\", \"Weakness 2\" ],\n" +
                "  \"topicsToRevise\": [ \"Topic 1\", \"Topic 2\" ],\n" +
                "  \"practiceAreas\": [ \"Area 1\", \"Area 2\" ],\n" +
                "  \"learningRecommendations\": \"Strategic actionable advice...\",\n" +
                "  \"dialogs\": [\n" +
                "    {\n" +
                "      \"question\": \"Question asked by interviewer\",\n" +
                "      \"userAnswer\": \"Answer given by candidate\",\n" +
                "      \"score\": 85, // question level score\n" +
                "      \"difficulty\": \"Easy or Medium or Hard\",\n" +
                "      \"strengths\": \"What went well\",\n" +
                "      \"weaknesses\": \"What could be improved\",\n" +
                "      \"fillerWordsUsed\": [ \"umm\", \"like\" ],\n" +
                "      \"modelAnswer\": \"STAR-structured reference model answer\"\n" +
                "    }\n" +
                "  ]\n" +
                "}",
                session.getCompanyName(), session.getJobTitle(), session.getInterviewType(), transcript
            );

            String systemPrompt = "You are a chief recruitment strategist configured to return valid, formatted JSON. Do not wrap in markdown or add comments. Return ONLY the raw JSON object.";
            String reportJson = geminiService.callOpenAiWithJson(systemPrompt, userPrompt);
            report = parseJsonSafely(reportJson);
        } catch (Exception e) {
            log.error("Failed to generate OpenAI performance report.", e);
            // Fallback
            report.put("overallScore", 60);
            report.put("technicalScore", 60);
            report.put("communicationScore", 60);
            report.put("confidenceScore", 60);
            report.put("behavioralScore", 60);
            report.put("problemSolvingScore", 60);
            report.put("strengths", Arrays.asList("Failed to parse report"));
            report.put("weaknesses", Arrays.asList("Failed to parse report"));
            report.put("topicsToRevise", Arrays.asList("Failed to parse report"));
            report.put("practiceAreas", Arrays.asList("Failed to parse report"));
            report.put("learningRecommendations", "Evaluation unavailable.");
        }

        // Map feedback metrics to entity
        session.setOverallScore(getIntegerMetric(report.get("overallScore"), 0));
        session.setTechnicalScore(getIntegerMetric(report.get("technicalScore"), 0));
        session.setCommunicationScore(getIntegerMetric(report.get("communicationScore"), 0));
        session.setConfidenceScore(getIntegerMetric(report.get("confidenceScore"), 0));
        session.setBehavioralScore(getIntegerMetric(report.get("behavioralScore"), 0));
        session.setProblemSolvingScore(getIntegerMetric(report.get("problemSolvingScore"), 0));

        try {
            session.setStrengths(objectMapper.writeValueAsString(report.get("strengths")));
            session.setWeaknesses(objectMapper.writeValueAsString(report.get("weaknesses")));

            Map<String, Object> timelinePlan = new HashMap<>();
            timelinePlan.put("topicsToRevise", report.get("topicsToRevise"));
            timelinePlan.put("practiceAreas", report.get("practiceAreas"));
            timelinePlan.put("learningRecommendations", report.get("learningRecommendations"));

            session.setImprovementPlan(objectMapper.writeValueAsString(timelinePlan));
        } catch (Exception e) {
            log.error("Failed to serialize sub-lists for DB storage", e);
        }

        session.setTranscript(transcript);
        session.setStatus("COMPLETED");
        interviewSessionRepository.save(session);

        // Delete dummy question slots and save parsed QAs
        List<InterviewQuestion> dummyQuestions = interviewQuestionRepository.findAllBySessionIdOrderByCreatedAtAsc(sessionId);
        interviewQuestionRepository.deleteAllInBatch(dummyQuestions);

        List<Map<String, Object>> parsedDialogs = (List<Map<String, Object>>) report.get("dialogs");
        if (parsedDialogs != null) {
            for (Map<String, Object> d : parsedDialogs) {
                try {
                    Map<String, Object> feedbackDetails = new HashMap<>();
                    feedbackDetails.put("score", d.get("score"));
                    feedbackDetails.put("strengths", d.get("strengths"));
                    feedbackDetails.put("weaknesses", d.get("weaknesses"));
                    feedbackDetails.put("fillerWordsUsed", d.get("fillerWordsUsed"));
                    feedbackDetails.put("modelAnswer", d.get("modelAnswer"));

                    InterviewQuestion q = InterviewQuestion.builder()
                            .session(session)
                            .question((String) d.get("question"))
                            .userAnswer((String) d.get("userAnswer"))
                            .aiFeedback(objectMapper.writeValueAsString(feedbackDetails))
                            .score(getIntegerMetric(d.get("score"), 0))
                            .difficulty(d.containsKey("difficulty") ? (String) d.get("difficulty") : "Medium")
                            .createdAt(LocalDateTime.now())
                            .build();
                    interviewQuestionRepository.save(q);
                } catch (Exception e) {
                    log.error("Failed to save parsed InterviewQuestion", e);
                }
            }
        }

        return getSessionReportPayload(session);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHistory(String email) {
        List<InterviewSession> sessions = interviewSessionRepository.findAllByUserEmailIgnoreCaseOrderByCreatedAtDesc(email);
        return sessions.stream()
                .map(this::getSessionReportPayload)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSessionReport(Long sessionId) {
        InterviewSession session = interviewSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with ID: " + sessionId));
        return getSessionReportPayload(session);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats(String email) {
        List<InterviewSession> sessions = interviewSessionRepository
                .findAllByUserEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(email, "COMPLETED");

        int count = sessions.size();
        double avgOverall = sessions.stream().mapToInt(InterviewSession::getOverallScore).average().orElse(0.0);
        double avgTech = sessions.stream().mapToInt(InterviewSession::getTechnicalScore).average().orElse(0.0);
        double avgComm = sessions.stream().mapToInt(InterviewSession::getCommunicationScore).average().orElse(0.0);
        double avgConf = sessions.stream().mapToInt(InterviewSession::getConfidenceScore).average().orElse(0.0);
        double avgProb = sessions.stream().mapToInt(InterviewSession::getProblemSolvingScore).average().orElse(0.0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalInterviews", count);
        stats.put("averageScore", Math.round(avgOverall));
        stats.put("communicationScore", Math.round(avgComm));
        stats.put("confidenceScore", Math.round(avgConf));
        stats.put("technicalScore", Math.round(avgTech));
        stats.put("problemSolvingScore", Math.round(avgProb));

        // Format history list for chronological graph trending
        List<Map<String, Object>> trendHistory = new ArrayList<>();
        // Reverse order so Interview #1 is first in chart rendering
        for (int i = sessions.size() - 1; i >= 0; i--) {
            InterviewSession s = sessions.get(i);
            Map<String, Object> entry = new HashMap<>();
            entry.put("interviewLabel", "Interview #" + (sessions.size() - i));
            entry.put("overallScore", s.getOverallScore());
            entry.put("technicalScore", s.getTechnicalScore());
            entry.put("communicationScore", s.getCommunicationScore());
            entry.put("confidenceScore", s.getConfidenceScore());
            entry.put("companyName", s.getCompanyName());
            trendHistory.add(entry);
        }
        stats.put("trends", trendHistory);

        return stats;
    }

    private int getIntegerMetric(Object val, int fallback) {
        if (val instanceof Number) {
            return ((Number) val).intValue();
        }
        return fallback;
    }

    private Map<String, Object> getSessionReportPayload(InterviewSession session) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", session.getId());
        payload.put("companyName", session.getCompanyName());
        payload.put("jobTitle", session.getJobTitle());
        payload.put("interviewType", session.getInterviewType());
        payload.put("duration", session.getDuration());
        payload.put("status", session.getStatus());
        payload.put("createdAt", session.getCreatedAt());

        payload.put("overallScore", session.getOverallScore());
        payload.put("technicalScore", session.getTechnicalScore());
        payload.put("communicationScore", session.getCommunicationScore());
        payload.put("confidenceScore", session.getConfidenceScore());
        payload.put("behavioralScore", session.getBehavioralScore());
        payload.put("problemSolvingScore", session.getProblemSolvingScore());

        try {
            payload.put("strengths", objectMapper.readValue(session.getStrengths() != null ? session.getStrengths() : "[]", List.class));
            payload.put("weaknesses", objectMapper.readValue(session.getWeaknesses() != null ? session.getWeaknesses() : "[]", List.class));
            payload.put("improvementPlan", objectMapper.readValue(session.getImprovementPlan() != null ? session.getImprovementPlan() : "{}", Map.class));
        } catch (Exception ignored) {}

        payload.put("transcript", session.getTranscript());

        // Fetch dialog Q&A items too
        List<InterviewQuestion> dialogQuestions = interviewQuestionRepository.findAllBySessionIdOrderByCreatedAtAsc(session.getId());
        List<Map<String, Object>> dialogs = dialogQuestions.stream()
                .filter(q -> q.getUserAnswer() != null)
                .map(q -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("question", q.getQuestion());
                    entry.put("userAnswer", q.getUserAnswer());
                    entry.put("score", q.getScore());
                    entry.put("difficulty", q.getDifficulty());
                    try {
                        entry.put("feedback", parseJsonSafely(q.getAiFeedback()));
                    } catch (Exception e) {
                        entry.put("feedback", new HashMap<>());
                    }
                    return entry;
                })
                .collect(Collectors.toList());
        
        payload.put("dialogs", dialogs);

        // Expose active/current unanswered question for frontend consumption
        Optional<InterviewQuestion> activeOpt = dialogQuestions.stream()
                .filter(q -> q.getUserAnswer() == null)
                .findFirst();
        if (activeOpt.isPresent()) {
            payload.put("currentQuestion", activeOpt.get().getQuestion());
            payload.put("currentDifficulty", activeOpt.get().getDifficulty());
        } else if (!dialogQuestions.isEmpty()) {
            payload.put("currentQuestion", dialogQuestions.get(dialogQuestions.size() - 1).getQuestion());
            payload.put("currentDifficulty", dialogQuestions.get(dialogQuestions.size() - 1).getDifficulty());
        }

        // Dynamically compute intro speech if starting fresh
        boolean startingFresh = dialogQuestions.size() == 1 && dialogQuestions.get(0).getUserAnswer() == null;
        if (startingFresh) {
            String candidateName = profileRepository.findByUserEmailIgnoreCase(session.getUser().getEmail())
                    .map(Profile::getFullName)
                    .orElse(session.getUser().getFullName());
            String intro = String.format("Hello %s. I am your AI interviewer. Today, I am going to conduct your %s interview for the %s position at %s. Let's begin.",
                    candidateName, session.getInterviewType(), session.getJobTitle(), session.getCompanyName());
            payload.put("introSpeech", intro);
        }

        if ("IN_PROGRESS".equals(session.getStatus())) {
            try {
                String candidateName = profileRepository.findByUserEmailIgnoreCase(session.getUser().getEmail())
                        .map(Profile::getFullName)
                        .orElse(session.getUser().getFullName());

                String companyName = session.getCompanyName();
                String jobTitle = session.getJobTitle();
                String interviewType = session.getInterviewType();

                Application app = session.getApplication();
                String jobDescription = "";
                String skillsRequired = "";
                if (app != null) {
                    Job job = app.getJob();
                    jobDescription = job != null ? job.getDescription() : "";
                    skillsRequired = job != null ? job.getSkillsRequired() : "";
                } else {
                    skillsRequired = extractedProfileRepository.findByUserEmailIgnoreCase(session.getUser().getEmail())
                            .map(ExtractedProfile::getSkills)
                            .orElse("");
                    jobDescription = "Google AI Studio Resume-Aware Prompt Grounding";
                }

                ExtractedProfile profile = extractedProfileRepository.findByUserEmailIgnoreCase(session.getUser().getEmail()).orElse(null);
                String resumeSkills = profile != null && profile.getSkills() != null ? profile.getSkills() : "";
                String resumeProjects = profile != null && profile.getProjects() != null ? profile.getProjects() : "";
                StringBuilder sb = new StringBuilder();
                if (profile != null) {
                    if (profile.getExperience() != null) sb.append("Experience: ").append(profile.getExperience()).append("\n");
                    if (profile.getEducation() != null) sb.append("Education: ").append(profile.getEducation()).append("\n");
                    if (profile.getKeywords() != null) sb.append("Keywords: ").append(profile.getKeywords()).append("\n");
                }
                String resumeExpEdu = sb.toString();

                List<String> excludedQuestions = getExcludedQuestionsForUser(session.getUser().getEmail());

                String introSpeech = String.format("Hello %s. I am Rachel, your virtual AI Recruiter coach today. We are going to conduct a dynamic %s interview tailored to %s. Let's begin. Could you please introduce yourself and tell me what technical stack you enjoy working with most?",
                        candidateName, interviewType,
                        ("Resume Based".equalsIgnoreCase(interviewType) || "Google AI Studio".equalsIgnoreCase(companyName)) ? "your resume details" : "the " + jobTitle + " position at " + companyName);

                Map<String, Object> vapiAssistantConfig = new HashMap<>();
                
                Map<String, Object> transcriber = new HashMap<>();
                transcriber.put("provider", "deepgram");
                transcriber.put("model", "nova-2");
                transcriber.put("language", "en-US");
                vapiAssistantConfig.put("transcriber", transcriber);

                Map<String, Object> modelConfig = new HashMap<>();
                modelConfig.put("provider", "openai");
                modelConfig.put("model", "gpt-4o");
                modelConfig.put("temperature", 0.7);
                
                String systemPrompt = buildSystemPrompt(candidateName, companyName, jobTitle, jobDescription, skillsRequired, interviewType, resumeSkills, resumeProjects, resumeExpEdu, excludedQuestions);
                modelConfig.put("systemPrompt", systemPrompt);
                vapiAssistantConfig.put("model", modelConfig);

                Map<String, Object> voiceConfig = new HashMap<>();
                voiceConfig.put("provider", "11labs");
                voiceConfig.put("voiceId", "21m00Tcm4TlvDq8ikWAM"); // ElevenLabs Rachel
                vapiAssistantConfig.put("voice", voiceConfig);

                vapiAssistantConfig.put("firstMessage", introSpeech);

                payload.put("vapiAssistantConfig", vapiAssistantConfig);
            } catch (Exception e) {
                log.error("Failed to build vapiAssistantConfig in getSessionReportPayload", e);
            }
        }

        return payload;
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
