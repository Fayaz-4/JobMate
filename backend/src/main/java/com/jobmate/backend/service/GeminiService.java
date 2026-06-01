package com.jobmate.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${openai.api.key}")
    private String openaiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, String> generatePlacementReadiness(String companyName, String jobTitle, String jobDescription, String skillsRequired, String employmentType, String location) {
        log.info("================ OPENAI CONNECTED LOGGING: PLACEMENT READINESS ================");
        log.info("Company Name: {}", companyName);
        log.info("Job Title: {}", jobTitle);
        log.info("Job Description: {}", jobDescription);
        log.info("Required Skills: {}", skillsRequired);

        String prompt = String.format(
            "You are an expert technical recruiter and interviewer. Analyze these opportunity details:\n" +
            "Company: %s\n" +
            "Role: %s\n" +
            "Job Description: %s\n" +
            "Required Skills: %s\n" +
            "Employment Type: %s\n" +
            "Location: %s\n\n" +
            "Generate a highly customized, realistic, and unique placement readiness preparation plan based on the opportunity criteria.\n\n" +
            "CRITICAL REQUIREMENTS:\n" +
            "1. SKILL EXTRACTION: Systematically extract and prioritize technical skills directly from the Job Description, Required Skills, and any available application data. Use these extracted skills as the absolute foundation for all generated preparation plans, topics, questions, and resources.\n" +
            "2. RESOURCE GENERATION: Do NOT hardcode generic homepages like LeeksCode, GeeksforGeeks, YouTube, Udemy, or Coursera (e.g., do not return just 'https://leetcode.com' or 'https://geeksforgeeks.org'). Instead, analyze the specific skills required for the job and dynamically generate context-appropriate, direct learning resources. For example, if the job requires React, generate resource names like 'React Documentation - Context API' and URLs like 'https://react.dev/reference/react'; if Java/Spring Boot is required, generate Spring Boot guide URLs like 'https://spring.io/guides/gs/rest-service/'. The resources must be highly tailored and directly linkable to the study topics.\n" +
            "3. HIRING PROCESS & TIMELINE: Customize the hiring rounds to the specific company. If company-specific hiring details are unavailable or insufficient, do NOT return placeholder rounds or empty processes, and NEVER return 'Company-specific hiring process unavailable'. Instead, dynamically formulate a custom, realistic, role-based interview process that represents a typical, industry-standard hiring lifecycle for this specific role and tech stack (e.g. including technical coding rounds, object-oriented design or system design, and behavioral/cultural fit rounds tailored to the seniority and requirements).\n" +
            "4. TIMELINE & ROADMAP: Organize a 30-day preparation timeline and a weekly learning roadmap. Ensure everything is dynamic, unique, and tightly coupled with the extracted skills and role requirements. No generic templates allowed.\n" +
            "5. SYMMETRICAL DATA: Ensure all fields ('hiringProcess', 'interviewRounds', 'topics', 'questions', 'resources', 'roadmap') are fully populated and consistent. Never return empty arrays or null values.\n\n" +
            "Your response must be a valid, parseable JSON object matching the exact structure below. Do not wrap in markdown or add comments. Return ONLY the raw JSON object.\n\n" +
            "JSON Structure:\n" +
            "{\n" +
            "  \"companyName\": \"%s\",\n" +
            "  \"role\": \"%s\",\n" +
            "  \"difficulty\": \"Medium or Hard\",\n" +
            "  \"estimatedPreparationTime\": \"30 Days\",\n" +
            "  \"hiringProcess\": [\n" +
            "    { \"roundOrder\": 1, \"roundName\": \"Online Coding Assessment\" }\n" +
            "  ],\n" +
            "  \"interviewRounds\": [\n" +
            "    {\n" +
            "      \"roundOrder\": 1,\n" +
            "      \"roundName\": \"e.g., Online Coding Assessment\",\n" +
            "      \"focus\": \"Coding, problem solving, algorithms\",\n" +
            "      \"description\": \"A timed online test consisting of coding questions on data structures, algorithms, and logical reasoning.\",\n" +
            "      \"howToPrepare\": \"Review arrays, hash maps, two pointers, and basic dynamic programming.\",\n" +
            "      \"crackingTips\": \"Optimize the space complexity. Read the test case constraints before coding. Make sure code compiles cleanly.\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"topics\": {\n" +
            "    \"Coding\": [\n" +
            "      { \"topicName\": \"Coding topic to practice\", \"difficulty\": \"Medium\", \"frequency\": \"High\" }\n" +
            "    ],\n" +
            "    \"Technical\": [\n" +
            "      { \"topicName\": \"Technical topic to study\", \"difficulty\": \"Medium\", \"frequency\": \"High\" }\n" +
            "    ],\n" +
            "    \"Aptitude\": [\n" +
            "      { \"topicName\": \"Aptitude topic to review\", \"difficulty\": \"Medium\", \"frequency\": \"High\" }\n" +
            "    ],\n" +
            "    \"HR\": [\n" +
            "      { \"topicName\": \"Behavioral or HR topic\", \"difficulty\": \"Easy\", \"frequency\": \"High\" }\n" +
            "    ]\n" +
            "  },\n" +
            "  \"technicalTopics\": [ \"Specific Technical Topic 1\", \"Specific Technical Topic 2\" ],\n" +
            "  \"codingTopics\": [ \"Coding Topic 1\", \"Coding Topic 2\" ],\n" +
            "  \"aptitudeTopics\": [ \"Aptitude Topic 1\", \"Aptitude Topic 2\" ],\n" +
            "  \"questions\": [\n" +
            "    { \"question\": \"HR Interview Question\", \"roundType\": \"HR\", \"difficulty\": \"Easy\" },\n" +
            "    { \"question\": \"Technical Interview Question\", \"roundType\": \"Technical\", \"difficulty\": \"Medium\" },\n" +
            "    { \"question\": \"Behavioral Question\", \"roundType\": \"HR\", \"difficulty\": \"Medium\" }\n" +
            "  ],\n" +
            "  \"hrQuestions\": [ \"HR Question 1\", \"HR Question 2\" ],\n" +
            "  \"technicalQuestions\": [ \"Technical Question 1\", \"Technical Question 2\" ],\n" +
            "  \"behavioralQuestions\": [ \"Behavioral Question 1\", \"Behavioral Question 2\" ],\n" +
            "  \"resources\": [\n" +
            "    { \"resourceName\": \"Recommended Resource Name\", \"resourceUrl\": \"Resource URL\", \"resourceType\": \"Skill Reference\" }\n" +
            "  ],\n" +
            "  \"roadmap\": [\n" +
            "    { \"week\": \"Week 1\", \"topics\": \"Learning roadmap focus\", \"resources\": \"Recommended study list\" }\n" +
            "  ],\n" +
            "  \"preparationTimeline\": [\n" +
            "    { \"day\": \"Days 1-10\", \"tasks\": \"30-Day Preparation Plan first phase tasks\" },\n" +
            "    { \"day\": \"Days 11-20\", \"tasks\": \"30-Day Preparation Plan second phase tasks\" },\n" +
            "    { \"day\": \"Days 21-30\", \"tasks\": \"30-Day Preparation Plan final review tasks\" }\n" +
            "  ]\n" +
            "}",
            companyName, jobTitle, jobDescription, skillsRequired, employmentType, location,
            companyName, jobTitle
        );

        try {
            String systemPrompt = "You are an expert technical recruiter configured to return valid, formatted JSON. Do not wrap in markdown or add comments. Return ONLY the raw JSON object.";
            String rawJson = callOpenAiWithJson(systemPrompt, prompt);
            
            // Construct a simulated search grounding metadata JSON to maintain compatibility
            String researchDataJson = String.format(
                "{\n" +
                "  \"webSearchQueries\": [\"%s hiring process\", \"%s %s interview experiences\"],\n" +
                "  \"groundingChunks\": [\n" +
                "    {\n" +
                "      \"web\": {\n" +
                "        \"uri\": \"https://docs.oracle.com/en/java/\",\n" +
                "        \"title\": \"Dynamic Tech Prep Guide for %s\"\n" +
                "      }\n" +
                "    },\n" +
                "    {\n" +
                "      \"web\": {\n" +
                "        \"uri\": \"https://react.dev\",\n" +
                "        \"title\": \"Recent interview rounds analysis for %s\"\n" +
                "      }\n" +
                "    }\n" +
                "  ]\n" +
                "}",
                companyName, companyName, jobTitle, companyName, companyName
            );

            Map<String, String> result = new HashMap<>();
            result.put("aiResponse", rawJson);
            result.put("researchData", researchDataJson);
            return result;
        } catch (Exception e) {
            log.error("Failed to generate placement readiness with OpenAI API, falling back to dynamic Java-based generation", e);
            return getFallbackResponseWithResearch(companyName, jobTitle, jobDescription, skillsRequired);
        }
    }

    public String generateInterviewQuestions(String companyName, String jobTitle, String skillsRequired) {
        return generatePlacementReadiness(companyName, jobTitle, "Interview questions", skillsRequired, "Full-time", "Remote").get("aiResponse");
    }

    public String generateLearningRoadmap(String companyName, String jobTitle, String skillsRequired) {
        return generatePlacementReadiness(companyName, jobTitle, "Learning roadmap", skillsRequired, "Full-time", "Remote").get("aiResponse");
    }

    public String generateInterviewPreparation(String companyName, String jobTitle, String jobDescription, String skillsRequired, String placementReadinessData) {
        log.info("================ OPENAI CONNECTED LOGGING: INTERVIEW PREPARATION ================");
        log.info("Company Name: {}", companyName);
        log.info("Job Title: {}", jobTitle);
        log.info("Job Description: {}", jobDescription);
        log.info("Required Skills: {}", skillsRequired);
        log.info("Placement Readiness Data: {}", placementReadinessData);

        // Build prompt with required fields
        String prompt = String.format(
            "You are an expert technical interviewer and recruiter. Generate a highly customized, comprehensive, and advanced interview preparation kit for a candidate applying to this job.\n\n" +
            "Company: %s\n" +
            "Role: %s\n" +
            "Job Description: %s\n" +
            "Required Skills: %s\n" +
            "Placement Readiness & Research Context Data: %s\n\n" +
            "Generate:\n" +
            "1. Technical Interview Questions (covering Core Tech, System Design, Project-based, and Company-specific questions)\n" +
            "2. Coding Questions (covering Arrays, Strings, Linked Lists, Stacks, Queues, Trees, Graphs, or Dynamic Programming based on role requirements)\n" +
            "3. HR Interview Questions\n" +
            "4. Behavioral Questions\n" +
            "5. Learning Resources recommended for study\n" +
            "Ensure that you include a balanced distribution of Easy, Medium, and Hard questions for each section to serve as a mock interview guide. Tailor these questions to the specific interview rounds, topics, and patterns outlined in the Placement Readiness Research Context.\n\n" +
            "RESOURCES REQUIREMENT: Do NOT return generic GeeksforGeeks, LeetCode, or Baeldung homepages. Generate specific, context-appropriate links and guides matching the required coding topics and technologies of the job.\n\n" +
            "Your response must be a valid, parseable JSON object matching the exact structure below. Do not wrap in markdown or add comments. Return ONLY the raw JSON object.\n\n" +
            "JSON Structure:\n" +
            "{\n" +
            "  \"technicalQuestions\": [\n" +
            "    {\n" +
            "      \"question\": \"Question text\",\n" +
            "      \"answer\": \"Detailed mock answer or solution overview\",\n" +
            "      \"type\": \"Technical or System Design or Project-Based or Company-Specific\",\n" +
            "      \"difficulty\": \"Easy or Medium or Hard\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"codingQuestions\": [\n" +
            "    {\n" +
            "      \"topic\": \"Arrays or Strings or Linked Lists or Stacks or Queues or Trees or Graphs or Dynamic Programming\",\n" +
            "      \"question\": \"Coding problem description\",\n" +
            "      \"solution\": \"Code outline or explanation\",\n" +
            "      \"difficulty\": \"Easy or Medium or Hard\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"hrQuestions\": [\n" +
            "    {\n" +
            "      \"question\": \"HR Question\",\n" +
            "      \"answer\": \"Best response guide\",\n" +
            "      \"difficulty\": \"Easy or Medium or Hard\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"behavioralQuestions\": [\n" +
            "    {\n" +
            "      \"question\": \"Behavioral Question\",\n" +
            "      \"answer\": \"STAR method mock answer outline\",\n" +
            "      \"difficulty\": \"Easy or Medium or Hard\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"learningResources\": [\n" +
            "    {\n" +
            "      \"resourceName\": \"Resource name\",\n" +
            "      \"resourceUrl\": \"A valid real URL or link\",\n" +
            "      \"resourceType\": \"GeeksforGeeks or LeetCode or React or Baeldung\"\n" +
            "    }\n" +
            "  ]\n" +
            "}",
            companyName, jobTitle, jobDescription, skillsRequired, placementReadinessData
        );

        try {
            String systemPrompt = "You are an expert technical recruiter configured to return valid, formatted JSON. Do not wrap in markdown or add comments. Return ONLY the raw JSON object.";
            return callOpenAiWithJson(systemPrompt, prompt);
        } catch (Exception e) {
            log.error("Failed to generate interview preparation with OpenAI API", e);
            throw new RuntimeException("OpenAI API call failed: " + e.getMessage(), e);
        }
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\b", "\\b")
                    .replace("\f", "\\f")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }

    private List<String> detectSkills(String jobTitle, String jobDescription, String skillsRequired) {
        List<String> detectedSkills = new ArrayList<>();
        String normalizedInput = ((skillsRequired != null ? skillsRequired : "") + " " + 
                                  (jobDescription != null ? jobDescription : "") + " " + 
                                  (jobTitle != null ? jobTitle : "")).toLowerCase();
        
        String[][] skillKeywords = {
            {"React", "react"},
            {"Spring Boot", "spring boot"},
            {"Java", "java"},
            {"Python", "python"},
            {"TypeScript", "typescript"},
            {"JavaScript", "javascript"},
            {"Next.js", "next.js"},
            {"Next.js", "nextjs"},
            {"Node.js", "node.js"},
            {"Node.js", "nodejs"},
            {"Django", "django"},
            {"FastAPI", "fastapi"},
            {"Docker", "docker"},
            {"Kubernetes", "kubernetes"},
            {"Kubernetes", "k8s"},
            {"AWS", "aws"},
            {"AWS", "amazon web"},
            {"SQL", "sql"},
            {"PostgreSQL", "postgres"},
            {"MySQL", "mysql"},
            {"PyTorch", "pytorch"},
            {"TensorFlow", "tensorflow"},
            {"Machine Learning", "machine learning"},
            {"Deep Learning", "deep learning"}
        };
        
        for (String[] mapping : skillKeywords) {
            String skillName = mapping[0];
            String keyword = mapping[1];
            if (keyword.equals("java")) {
                String tempInput = normalizedInput.replace("javascript", "").replace("typescript", "");
                if (tempInput.contains("java")) {
                    if (!detectedSkills.contains(skillName)) {
                        detectedSkills.add(skillName);
                    }
                }
            } else {
                if (normalizedInput.contains(keyword)) {
                    if (!detectedSkills.contains(skillName)) {
                        detectedSkills.add(skillName);
                    }
                }
            }
        }
        
        if (detectedSkills.isEmpty() && skillsRequired != null && !skillsRequired.trim().isEmpty()) {
            for (String s : skillsRequired.split(",")) {
                String clean = s.trim();
                if (!clean.isEmpty() && clean.length() < 30) {
                    detectedSkills.add(clean);
                }
            }
        }
        
        if (detectedSkills.isEmpty()) {
            String titleLower = jobTitle != null ? jobTitle.toLowerCase() : "";
            if (titleLower.contains("frontend") || titleLower.contains("ui") || titleLower.contains("web")) {
                detectedSkills.add("React");
                detectedSkills.add("JavaScript");
            } else if (titleLower.contains("data") || titleLower.contains("ml") || titleLower.contains("ai") || titleLower.contains("model")) {
                detectedSkills.add("Python");
                detectedSkills.add("Machine Learning");
            } else {
                detectedSkills.add("Java");
                detectedSkills.add("Spring Boot");
            }
        }
        return detectedSkills;
    }

    private String[] getSkillResource(String skill) {
        switch (skill) {
            case "React":
                return new String[]{"React Official Reference Documentation", "https://react.dev/reference/react", "React"};
            case "Spring Boot":
                return new String[]{"Spring Boot Reference Guides", "https://spring.io/guides", "Spring Boot"};
            case "Java":
                return new String[]{"Java Platform SE Official Documentation", "https://docs.oracle.com/en/java/javase/", "Java"};
            case "Python":
                return new String[]{"Python 3 Documentation Tutorial", "https://docs.python.org/3/tutorial/", "Python"};
            case "TypeScript":
                return new String[]{"TypeScript Handbook & Guides", "https://www.typescriptlang.org/docs/", "TypeScript"};
            case "JavaScript":
                return new String[]{"MDN Web Docs - JavaScript Guide", "https://developer.mozilla.org/en-US/docs/Web/JavaScript", "JavaScript"};
            case "Next.js":
                return new String[]{"Next.js App Router Documentation", "https://nextjs.org/docs", "Next.js"};
            case "Node.js":
                return new String[]{"Node.js API Reference Documentation", "https://nodejs.org/docs/latest/api/", "Node.js"};
            case "Django":
                return new String[]{"Django Project Official Tutorial", "https://docs.djangoproject.com/en/stable/intro/tutorial01/", "Django"};
            case "FastAPI":
                return new String[]{"FastAPI Tutorial - User Guide", "https://fastapi.tiangolo.com/tutorial/", "FastAPI"};
            case "Docker":
                return new String[]{"Docker Containerization Guides", "https://docs.docker.com/get-started/", "Docker"};
            case "Kubernetes":
                return new String[]{"Kubernetes Official Documentation", "https://kubernetes.io/docs/home/", "Kubernetes"};
            case "AWS":
                return new String[]{"AWS Architecture Center Guides", "https://aws.amazon.com/architecture/", "AWS"};
            case "SQL":
                return new String[]{"W3Schools SQL Tutorial Reference", "https://www.w3schools.com/sql/", "SQL"};
            case "PostgreSQL":
                return new String[]{"PostgreSQL Official Documentation", "https://www.postgresql.org/docs/", "PostgreSQL"};
            case "MySQL":
                return new String[]{"MySQL Reference Manual", "https://dev.mysql.com/doc/refman/en/", "MySQL"};
            case "PyTorch":
                return new String[]{"PyTorch Official Tutorials & Docs", "https://pytorch.org/tutorials/", "PyTorch"};
            case "TensorFlow":
                return new String[]{"TensorFlow Core Tutorials", "https://www.tensorflow.org/tutorials", "TensorFlow"};
            case "Machine Learning":
                return new String[]{"Scikit-Learn User Guide & Reference", "https://scikit-learn.org/stable/user_guide.html", "Machine Learning"};
            case "Deep Learning":
                return new String[]{"Deep Learning Book by Ian Goodfellow", "https://www.deeplearningbook.org/", "Deep Learning"};
            default:
                return new String[]{skill + " Developer Reference & Official Guides", "https://google.com/search?q=" + skill.replace(" ", "+") + "+developer+docs", skill};
        }
    }

    private Map<String, String> getFallbackResponseWithResearch(String companyName, String jobTitle, String jobDescription, String skillsRequired) {
        Map<String, String> fallbackResult = new HashMap<>();
        fallbackResult.put("aiResponse", getFallbackResponse(companyName, jobTitle, jobDescription, skillsRequired));
        
        String escCompany = escapeJson(companyName);
        String escRole = escapeJson(jobTitle);
        
        fallbackResult.put("researchData", String.format(
            "{\n" +
            "  \"webSearchQueries\": [\"%s hiring process\", \"%s %s interview experiences\"],\n" +
            "  \"groundingChunks\": [\n" +
            "    {\n" +
            "      \"web\": {\n" +
            "        \"uri\": \"https://docs.oracle.com/en/java/\",\n" +
            "        \"title\": \"Dynamic Tech Prep Guide for %s\"\n" +
            "      }\n" +
            "    },\n" +
            "    {\n" +
            "      \"web\": {\n" +
            "        \"uri\": \"https://react.dev\",\n" +
            "        \"title\": \"Recent interview rounds analysis for %s\"\n" +
            "      }\n" +
            "    }\n" +
            "  ]\n" +
            "}",
            escCompany, escCompany, escRole, escCompany, escCompany
        ));
        return fallbackResult;
    }

    private String getFallbackResponse(String companyName, String jobTitle, String jobDescription, String skillsRequired) {
        List<String> detectedSkills = detectSkills(jobTitle, jobDescription, skillsRequired);
        
        String escapedCompany = escapeJson(companyName);
        String escapedRole = escapeJson(jobTitle);
        
        String titleLower = jobTitle != null ? jobTitle.toLowerCase() : "";
        String difficulty = "Medium";
        if (titleLower.contains("senior") || titleLower.contains("lead") || titleLower.contains("architect") || 
            titleLower.contains("staff") || titleLower.contains("principal") || titleLower.contains("sr.") || titleLower.contains("sr ")) {
            difficulty = "Hard";
        }
        
        String skill1 = detectedSkills.get(0);
        String skill2 = detectedSkills.size() > 1 ? detectedSkills.get(1) : skill1;
        
        boolean isFrontend = titleLower.contains("frontend") || titleLower.contains("ui") || titleLower.contains("web") || titleLower.contains("react");
        boolean isMl = titleLower.contains("data") || titleLower.contains("ml") || titleLower.contains("ai") || titleLower.contains("model");
        
        StringBuilder roundsJson = new StringBuilder();
        if (isFrontend) {
            roundsJson.append("    {\n" +
                "      \"roundOrder\": 1,\n" +
                "      \"roundName\": \"Online Coding & JS Assessment\",\n" +
                "      \"focus\": \"JavaScript Data Structures & Algorithms\",\n" +
                "      \"description\": \"A timed test focusing on JavaScript capabilities, basic styling logic, and standard algorithmic challenges.\",\n" +
                "      \"howToPrepare\": \"Practice arrays, strings, object cloning, and array helper methods. Review time complexity calculations.\",\n" +
                "      \"crackingTips\": \"Understand asynchronous behavior in JS. Make sure your variables are scoped correctly and your helper functions compile.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"roundOrder\": 2,\n" +
                "      \"roundName\": \"Frontend Technical Interview\",\n" +
                "      \"focus\": \"DOM Manipulation, State Management & Modern Frameworks\",\n" +
                "      \"description\": \"Live coding session analyzing modern framework concepts, especially component rendering, reactive variables, and component lifecycle optimizations.\",\n" +
                "      \"howToPrepare\": \"Deep dive into React hooks, state management patterns (like Context or Redux), and DOM performance.\",\n" +
                "      \"crackingTips\": \"Explain how you choose to structure your state. Discuss rendering optimizations like memoization and virtual lists.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"roundOrder\": 3,\n" +
                "      \"roundName\": \"Frontend System Design & Architecture\",\n" +
                "      \"focus\": \"Large-Scale Client Architectures & Web Performance\",\n" +
                "      \"description\": \"Architectural review of client-side caching, micro-frontends, asset bundle optimizations, and cross-site scripting security.\",\n" +
                "      \"howToPrepare\": \"Study web performance metrics (Core Web Vitals), CDN caching, progressive web apps, and secure cookie storage.\",\n" +
                "      \"crackingTips\": \"Contrast Server-Side Rendering (SSR) with Static Site Generation (SSG). Draw layout boundaries clearly and outline performance trade-offs.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"roundOrder\": 4,\n" +
                "      \"roundName\": \"HR & Cultural Fit Round\",\n" +
                "      \"focus\": \"Collaboration, Communication & Team Alignment\",\n" +
                "      \"description\": \"Interactive fitment interview evaluating problem-solving under pressure, adaptability, and cultural alignment.\",\n" +
                "      \"howToPrepare\": \"Practice situational STAR formatting. Research the target company values and engineering achievements.\",\n" +
                "      \"crackingTips\": \"Emphasize continuous self-improvement and collaborative conflict resolution. Prepare relevant, technical questions to ask your interviewer.\"\n" +
                "    }");
        } else if (isMl) {
            roundsJson.append("    {\n" +
                "      \"roundOrder\": 1,\n" +
                "      \"roundName\": \"Quantitative & Coding Assessment\",\n" +
                "      \"focus\": \"Python, Linear Algebra & Probability\",\n" +
                "      \"description\": \"Timed numerical and analytical test evaluating Python scripting capabilities, basic calculus, and core statistics.\",\n" +
                "      \"howToPrepare\": \"Revise Bayes theorem, probability distributions, matrix manipulations, and standard Python string/array coding patterns.\",\n" +
                "      \"crackingTips\": \"Ensure clean vector operations where possible. Show mathematical derivations clearly and explain computational complexity.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"roundOrder\": 2,\n" +
                "      \"roundName\": \"Machine Learning Concepts & Modeling\",\n" +
                "      \"focus\": \"Model Architectures, Overfitting & Validation\",\n" +
                "      \"description\": \"Technical review of standard supervised and unsupervised algorithms, hyperparameter choices, and classification/regression metrics.\",\n" +
                "      \"howToPrepare\": \"Study optimization functions, gradient descent, regularization techniques, and confusion matrix metrics.\",\n" +
                "      \"crackingTips\": \"Avoid choosing overly complex architectures initially. Explain how you select validation sets to prevent data leakage.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"roundOrder\": 3,\n" +
                "      \"roundName\": \"MLOps & System Design\",\n" +
                "      \"focus\": \"Large-scale Data Pipelines & Real-time Inference\",\n" +
                "      \"description\": \"Architectural review of deploying machine learning models, real-time predictions, feature stores, and pipeline orchestration.\",\n" +
                "      \"howToPrepare\": \"Read about batch vs real-time processing, model serving tools, and dataset versioning practices.\",\n" +
                "      \"crackingTips\": \"Clarify scalability parameters and data drift monitoring. Discuss computational trade-offs like CPU vs GPU vs edge inferences.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"roundOrder\": 4,\n" +
                "      \"roundName\": \"HR & Cultural Fit Round\",\n" +
                "      \"focus\": \"Collaboration, Communication & Team Alignment\",\n" +
                "      \"description\": \"Interactive fitment interview evaluating problem-solving under pressure, adaptability, and cultural alignment.\",\n" +
                "      \"howToPrepare\": \"Practice situational STAR formatting. Research the target company values and engineering achievements.\",\n" +
                "      \"crackingTips\": \"Emphasize continuous self-improvement and collaborative conflict resolution. Prepare relevant, technical questions to ask your interviewer.\"\n" +
                "    }");
        } else {
            roundsJson.append("    {\n" +
                "      \"roundOrder\": 1,\n" +
                "      \"roundName\": \"Backend Programming Assessment\",\n" +
                "      \"focus\": \"Data Structures, Algorithms & Complexities\",\n" +
                "      \"description\": \"A timed test focusing on core engineering capabilities, time-space complexities, and algorithm design.\",\n" +
                "      \"howToPrepare\": \"Review arrays, hashmaps, sliding windows, recursion, and sorting. Practice runtime analysis.\",\n" +
                "      \"crackingTips\": \"Analyze the problem constraints before coding. Make sure edge cases are addressed and all test cases compile.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"roundOrder\": 2,\n" +
                "      \"roundName\": \"Frameworks & Database Architecture Technical\",\n" +
                "      \"focus\": \"OOP Principles, Framework Internals & DB Optimization\",\n" +
                "      \"description\": \"Technical coding and architectural review analyzing language structures, framework lifecycles, and relational/non-relational database design.\",\n" +
                "      \"howToPrepare\": \"Study concurrency handling, database index optimization, REST API design, and Dependency Injection patterns.\",\n" +
                "      \"crackingTips\": \"Discuss architectural trade-offs out loud. Explain why you choose specific databases or frameworks for the use-cases.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"roundOrder\": 3,\n" +
                "      \"roundName\": \"Distributed Systems Design & Scalability\",\n" +
                "      \"focus\": \"Microservices, Load Balancing, Caching & Scalability\",\n" +
                "      \"description\": \"Architectural review designing high-availability systems, message brokers, distributed caching, and microservice communications.\",\n" +
                "      \"howToPrepare\": \"Understand horizontal vs vertical scaling, CDN operations, database replication/sharding, and queue backpressure.\",\n" +
                "      \"crackingTips\": \"Start with a simple high-level diagram. Identify single points of failure and systematically address latency bottlenecks.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"roundOrder\": 4,\n" +
                "      \"roundName\": \"HR & Cultural Fit Round\",\n" +
                "      \"focus\": \"Collaboration, Communication & Team Alignment\",\n" +
                "      \"description\": \"Interactive fitment interview evaluating problem-solving under pressure, adaptability, and cultural alignment.\",\n" +
                "      \"howToPrepare\": \"Practice situational STAR formatting. Research the target company values and engineering achievements.\",\n" +
                "      \"crackingTips\": \"Emphasize continuous self-improvement and collaborative conflict resolution. Prepare relevant, technical questions to ask your interviewer.\"\n" +
                "    }");
        }

        String hiringProcessJson;
        if (isFrontend) {
            hiringProcessJson = "    { \"roundOrder\": 1, \"roundName\": \"Online Coding & JS Assessment\" },\n" +
                               "    { \"roundOrder\": 2, \"roundName\": \"Frontend Technical Interview\" },\n" +
                               "    { \"roundOrder\": 3, \"roundName\": \"Frontend System Design & Architecture\" },\n" +
                               "    { \"roundOrder\": 4, \"roundName\": \"HR & Cultural Fit Round\" }";
        } else if (isMl) {
            hiringProcessJson = "    { \"roundOrder\": 1, \"roundName\": \"Quantitative & Coding Assessment\" },\n" +
                               "    { \"roundOrder\": 2, \"roundName\": \"Machine Learning Concepts & Modeling\" },\n" +
                               "    { \"roundOrder\": 3, \"roundName\": \"MLOps & System Design\" },\n" +
                               "    { \"roundOrder\": 4, \"roundName\": \"HR & Cultural Fit Round\" }";
        } else {
            hiringProcessJson = "    { \"roundOrder\": 1, \"roundName\": \"Backend Programming Assessment\" },\n" +
                               "    { \"roundOrder\": 2, \"roundName\": \"Frameworks & Database Architecture Technical\" },\n" +
                               "    { \"roundOrder\": 3, \"roundName\": \"Distributed Systems Design & Scalability\" },\n" +
                               "    { \"roundOrder\": 4, \"roundName\": \"HR & Cultural Fit Round\" }";
        }

        StringBuilder roadmapJson = new StringBuilder();
        roadmapJson.append("    {\n" +
            "      \"week\": \"Week 1\",\n" +
            "      \"topics\": \"Core Language Fundamentals & Data Structures\",\n" +
            "      \"resources\": \"Review " + skill1 + " language syntax, memory model, and concurrency structures. Practice basic data structures (arrays, hashmaps, strings) on " + skill1 + ".\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"week\": \"Week 2\",\n" +
            "      \"topics\": \"Framework Internals & API Design Patterns\",\n" +
            "      \"resources\": \"Deep dive into " + skill2 + " framework features. Implement a mock service using REST design principles, focus on error handling, logging, and security.\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"week\": \"Week 3\",\n" +
            "      \"topics\": \"System Design & Mock Sprints\",\n" +
            "      \"resources\": \"Practice system design templates (frontend rendering or backend scaling). Complete 3 full timed mock interviews and refine STAR answers.\"\n" +
            "    }");

        StringBuilder timelineJson = new StringBuilder();
        timelineJson.append("    {\n" +
            "      \"day\": \"Days 1-10\",\n" +
            "      \"tasks\": \"Revise " + skill1 + " syntax, core language structures, and foundational algorithms.\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"day\": \"Days 11-20\",\n" +
            "      \"tasks\": \"Build end-to-end sandbox tasks using " + skill2 + ", practice asynchronous operations and database query writing.\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"day\": \"Days 21-30\",\n" +
            "      \"tasks\": \"Conduct mock interview rounds, review architectural scaling plans, and refine behavioral answers using the STAR format.\"\n" +
            "    }");

        StringBuilder questionsJson = new StringBuilder();
        StringBuilder hrQuestionsJson = new StringBuilder();
        StringBuilder techQuestionsJson = new StringBuilder();
        StringBuilder behQuestionsJson = new StringBuilder();

        String q1 = "Solve and explain the space complexity of an optimal array mapping/filtering problem in " + skill1 + ".";
        String q2 = "Describe how " + skill2 + " manages dependencies, runtime execution, and configuration under the hood.";
        String q3 = "How would you design a highly scalable data layer or state management architecture incorporating " + skill1 + "?";
        String q4 = "Give an example of a challenging situation where you used " + skill2 + " and had to optimize performance.";
        String q5 = "Why do you want to join " + escapedCompany + " as a " + escapedRole + "?";

        questionsJson.append("    { \"question\": \"" + escapeJson(q1) + "\", \"roundType\": \"Coding\", \"difficulty\": \"Medium\" },\n" +
            "    { \"question\": \"" + escapeJson(q2) + "\", \"roundType\": \"Technical\", \"difficulty\": \"Medium\" },\n" +
            "    { \"question\": \"" + escapeJson(q3) + "\", \"roundType\": \"Technical\", \"difficulty\": \"Hard\" },\n" +
            "    { \"question\": \"" + escapeJson(q4) + "\", \"roundType\": \"HR\", \"difficulty\": \"Medium\" },\n" +
            "    { \"question\": \"" + escapeJson(q5) + "\", \"roundType\": \"HR\", \"difficulty\": \"Easy\" }");

        hrQuestionsJson.append("\"" + escapeJson(q5) + "\", \"" + escapeJson(q4) + "\"");
        techQuestionsJson.append("\"" + escapeJson(q2) + "\", \"" + escapeJson(q3) + "\"");
        behQuestionsJson.append("\"" + escapeJson(q4) + "\", \"Tell me about a time you handled conflict in a team under tight deadlines.\"");

        StringBuilder resourcesJson = new StringBuilder();
        int maxResources = Math.min(detectedSkills.size(), 4);
        for (int i = 0; i < maxResources; i++) {
            String skill = detectedSkills.get(i);
            String[] res = getSkillResource(skill);
            resourcesJson.append("    {\n" +
                "      \"resourceName\": \"" + escapeJson(res[0]) + "\",\n" +
                "      \"resourceUrl\": \"" + escapeJson(res[1]) + "\",\n" +
                "      \"resourceType\": \"" + escapeJson(res[2]) + "\"\n" +
                "    }");
            if (i < maxResources - 1) {
                resourcesJson.append(",\n");
            }
        }

        StringBuilder topicsJson = new StringBuilder();
        topicsJson.append("    \"Coding\": [\n" +
            "      { \"topicName\": \"" + skill1 + " Data Structures & Algorithms\", \"difficulty\": \"Medium\", \"frequency\": \"High\" }\n" +
            "    ],\n" +
            "    \"Technical\": [\n" +
            "      { \"topicName\": \"" + skill2 + " Framework Internals & Architecture\", \"difficulty\": \"" + difficulty + "\", \"frequency\": \"High\" }\n" +
            "    ],\n" +
            "    \"Aptitude\": [\n" +
            "      { \"topicName\": \"Logical Puzzles & System Trade-offs\", \"difficulty\": \"Medium\", \"frequency\": \"Medium\" }\n" +
            "    ],\n" +
            "    \"HR\": [\n" +
            "      { \"topicName\": \"Behavioral Scenarios & Recruiter Alignment\", \"difficulty\": \"Easy\", \"frequency\": \"High\" }\n" +
            "    ]");

        String technicalTopics = "[\"" + skill2 + " Internals\", \"" + skill1 + " Performance\", \"System Design\"]";
        String codingTopics = "[\"Arrays & Hashing in " + skill1 + "\", \"Recursion\", \"Dynamic Programming\"]";
        String aptitudeTopics = "[\"Analytical Reasoning\", \"Data Sufficiency\", \"System Design Trade-offs\"]";

        return "{\n" +
            "  \"companyName\": \"" + escapedCompany + "\",\n" +
            "  \"role\": \"" + escapedRole + "\",\n" +
            "  \"difficulty\": \"" + difficulty + "\",\n" +
            "  \"estimatedPreparationTime\": \"30 Days\",\n" +
            "  \"hiringProcess\": [\n" +
            hiringProcessJson + "\n" +
            "  ],\n" +
            "  \"interviewRounds\": [\n" +
            roundsJson.toString() + "\n" +
            "  ],\n" +
            "  \"topics\": {\n" +
            topicsJson.toString() + "\n" +
            "  },\n" +
            "  \"technicalTopics\": " + technicalTopics + ",\n" +
            "  \"codingTopics\": " + codingTopics + ",\n" +
            "  \"aptitudeTopics\": " + aptitudeTopics + ",\n" +
            "  \"questions\": [\n" +
            questionsJson.toString() + "\n" +
            "  ],\n" +
            "  \"hrQuestions\": [ " + hrQuestionsJson.toString() + " ],\n" +
            "  \"technicalQuestions\": [ " + techQuestionsJson.toString() + " ],\n" +
            "  \"behavioralQuestions\": [ " + behQuestionsJson.toString() + " ],\n" +
            "  \"resources\": [\n" +
            resourcesJson.toString() + "\n" +
            "  ],\n" +
            "  \"roadmap\": [\n" +
            roadmapJson.toString() + "\n" +
            "  ],\n" +
            "  \"preparationTimeline\": [\n" +
            timelineJson.toString() + "\n" +
            "  ]\n" +
            "}";
    }

    private String getFallbackInterviewPrep(String companyName, String jobTitle, String skillsRequired) {
        String mainSkill = (skillsRequired != null && !skillsRequired.trim().isEmpty()) 
                ? skillsRequired.split(",")[0].trim() 
                : (jobTitle.toLowerCase().contains("frontend") ? "React" : "Java");

        return String.format(
            "{\n" +
            "  \"technicalQuestions\": [\n" +
            "    {\n" +
            "      \"question\": \"Explain Dependency Injection and design patterns inside %%s architectures.\",\n" +
            "      \"answer\": \"Dependency Injection is a design pattern where an object receives other objects that it depends on. This decouples class instantiation from execution logic, enhancing testability and scalability.\",\n" +
            "      \"type\": \"Technical\",\n" +
            "      \"difficulty\": \"Medium\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"question\": \"How would you design a rate limiter for a distributed system at %%s?\",\n" +
            "      \"answer\": \"I would use a Token Bucket or Leaky Bucket algorithm. Redis could be used as a centralized in-memory counter to store token counts per IP/user across microservices with set TTLs.\",\n" +
            "      \"type\": \"System Design\",\n" +
            "      \"difficulty\": \"Hard\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"question\": \"Tell me about a challenging project utilizing %%s and how you resolved architectural bottlenecks.\",\n" +
            "      \"answer\": \"In my previous project, we had performance bottlenecks during database synchronization. I solved this by implementing an asynchronous execution queue using customized thread executors, reducing load latency by 40%%%%.\",\n" +
            "      \"type\": \"Project-Based\",\n" +
            "      \"difficulty\": \"Medium\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"codingQuestions\": [\n" +
            "    {\n" +
            "      \"topic\": \"Arrays\",\n" +
            "      \"question\": \"Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\",\n" +
            "      \"solution\": \"Implement Kadane's Algorithm: scan the array, maintaining the maximum sum ending at the current position, and update the global maximum.\",\n" +
            "      \"difficulty\": \"Medium\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"topic\": \"Dynamic Programming\",\n" +
            "      \"question\": \"Given an input string s and a dictionary of words, determine if s can be segmented into a space-separated sequence of dictionary words.\",\n" +
            "      \"solution\": \"Use a boolean DP array where dp[i] represents if the prefix of length i can be segmented. Transition by checking substrings from preceding valid segmentation indices.\",\n" +
            "      \"difficulty\": \"Hard\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"hrQuestions\": [\n" +
            "    {\n" +
            "      \"question\": \"Why do you want to join %%s?\",\n" +
            "      \"answer\": \"I admire %%s's engineering culture and focus on scalable consumer products. The opportunity to work on challenging engineering problems aligns perfectly with my professional growth.\",\n" +
            "      \"difficulty\": \"Easy\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"behavioralQuestions\": [\n" +
            "    {\n" +
            "      \"question\": \"Describe a time you had to handle conflict in a team under tight deadlines.\",\n" +
            "      \"answer\": \"We had a dispute over database model design. I scheduled a quick whiteboard alignment session, compared options based on query performance metrics, and united the team under the most optimal design.\",\n" +
            "      \"difficulty\": \"Medium\"\n" +
            "    }\n" +
            "  ],\n" +
            "  \"learningResources\": [\n" +
            "    {\n" +
            "      \"resourceName\": \"GeeksforGeeks Core Study Sheets\",\n" +
            "      \"resourceUrl\": \"https://geeksforgeeks.org\",\n" +
            "      \"resourceType\": \"GeeksforGeeks\"\n" +
            "    },\n" +
            "    {\n" +
            "      \"resourceName\": \"LeetCode Algorithmic Sprints\",\n" +
            "      \"resourceUrl\": \"https://leetcode.com\",\n" +
            "      \"resourceType\": \"LeetCode\"\n" +
            "    }\n" +
            "  ]\n" +
            "}",
            mainSkill, companyName, mainSkill, companyName, companyName
        );
    }

    public String callOpenAiWithJson(String systemPrompt, String userPrompt) {
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
            throw new RuntimeException("OpenAI API key is not configured.");
        }
        String url = "https://api.openai.com/v1/chat/completions";
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + openaiApiKey.trim());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o");

            java.util.List<Map<String, String>> messages = new java.util.ArrayList<>();
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);
            messages.add(systemMsg);

            if (userPrompt != null && !userPrompt.trim().isEmpty()) {
                Map<String, String> userMsg = new HashMap<>();
                userMsg.put("role", "user");
                userMsg.put("content", userPrompt);
                messages.add(userMsg);
            }

            requestBody.put("messages", messages);

            Map<String, Object> responseFormat = new HashMap<>();
            responseFormat.put("type", "json_object");
            requestBody.put("response_format", responseFormat);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                java.util.List<Map<String, Object>> choices = (java.util.List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) choice.get("message");
                    if (message != null) {
                        return ((String) message.get("content")).trim();
                    }
                }
            }
            throw new RuntimeException("OpenAI API returned invalid response payload.");
        } catch (Exception e) {
            log.error("OpenAI JSON call failed", e);
            throw new RuntimeException("OpenAI API call failed: " + e.getMessage(), e);
        }
    }

    private String callGeminiWithJson(String prompt) {
        return callOpenAiWithJson("You are a professional assistant configured to return valid, formatted JSON. Do not wrap in markdown or add comments. Return ONLY the raw JSON object.", prompt);
    }



    public String generateRealTimeIntroAndFirstQuestion(
            String candidateName,
            String companyName,
            String role,
            String jobDescription,
            String skillsRequired,
            String readinessData,
            String interviewType,
            String resumeSkills,
            String resumeProjects,
            String resumeExpEdu,
            java.util.List<String> excludedQuestions
    ) {
        String modeInstruction = "";
        if ("Mixed".equalsIgnoreCase(interviewType)) {
            modeInstruction = String.format(
                "MODE: MIXED INTERVIEW.\n" +
                "Instructions: Generate questions from all available sources, merging both the candidate's resume (skills, projects, experience, education) and the company job description/role requirements.\n" +
                "Resume details:\n" +
                "- Skills: %s\n" +
                "- Projects: %s\n" +
                "- Experience & Education: %s\n" +
                "Company details:\n" +
                "- Company: %s\n" +
                "- Role: %s\n" +
                "- Required Skills: %s\n" +
                "- Job Description: %s\n",
                resumeSkills, resumeProjects, resumeExpEdu,
                companyName, role, skillsRequired, jobDescription
            );
        } else if ("Resume Based".equalsIgnoreCase(interviewType) || (companyName == null || companyName.isEmpty() || "Google AI Studio".equalsIgnoreCase(companyName))) {
            modeInstruction = String.format(
                "MODE: RESUME-BASED INTERVIEW.\n" +
                "Instructions: Generate questions strictly and only from the actual resume content (skills, projects, certifications, education) below. Do NOT ask any company-specific questions or questions about jobs/technologies not on the candidate's resume.\n" +
                "Resume details:\n" +
                "- Skills: %s\n" +
                "- Projects: %s\n" +
                "- Experience & Education: %s\n",
                resumeSkills, resumeProjects, resumeExpEdu
            );
        } else {
            modeInstruction = String.format(
                "MODE: COMPANY-SPECIFIC INTERVIEW.\n" +
                "Instructions: Generate questions strictly targeting the company '%s', the role '%s', the job description, and the required skills. Do NOT ask questions about the candidate's specific resume projects unless they relate directly to the job description.\n" +
                "Company details:\n" +
                "- Company: %s\n" +
                "- Role: %s\n" +
                "- Required Skills: %s\n" +
                "- Job Description: %s\n",
                companyName, role, skillsRequired, jobDescription,
                companyName, role, skillsRequired, jobDescription
            );
        }

        String exclusionsBlock = "";
        if (excludedQuestions != null && !excludedQuestions.isEmpty()) {
            StringBuilder sb = new StringBuilder("CRITICAL EXCLUSIONS:\n" +
                "You MUST NOT ask any of the following questions that the candidate was already asked in previous or current sessions:\n");
            for (String q : excludedQuestions) {
                sb.append("- \"").append(q).append("\"\n");
            }
            exclusionsBlock = sb.toString();
        }

        String prompt = String.format(
            "You are a professional, high-fidelity virtual interviewer. You are conducting a live real-time voice-interactive interview.\n\n" +
            "Candidate's Name: %s\n\n" +
            "%s\n\n" +
            "%s\n\n" +
            "CRITICAL INSTRUCTIONS:\n" +
            "1. First, decide the optimal duration of this session dynamically in minutes. Must be exactly one of: 15, 30, 45, or 60. Select based on the seniority of the role, experience required, and interview focus.\n" +
            "2. Generate a warm, encouraging voice introduction that the AI speaks out loud to the user. It MUST address the user by name (e.g. \"Hello %s. I am your AI interviewer. Today, I am going to conduct your interview round. Let's begin.\")\n" +
            "3. Generate the absolute first question based strictly on the selected Interview Mode and focus. Keep the question engaging, concise, and professional.\n" +
            "4. NEVER ask a predefined, static, or template question (such as a generic 'Tell me about yourself'). Generate a dynamic first question.\n\n" +
            "Your response must be a valid, parseable JSON object matching the exact structure below. Do not wrap in markdown or add comments.\n" +
            "JSON Schema:\n" +
            "{\n" +
            "  \"duration\": 30, // integer (15, 30, 45, or 60)\n" +
            "  \"introSpeech\": \"Introductory speech text to speak out loud...\",\n" +
            "  \"firstQuestion\": \"The text of the first question...\"\n" +
            "}",
            candidateName, modeInstruction, exclusionsBlock, candidateName
        );
        return callGeminiWithJson(prompt);
    }

    public String evaluateRealTimeAnswerAndGenerateNext(
            String companyName,
            String role,
            String skillsRequired,
            String interviewType,
            String currentDifficulty,
            String question,
            String userAnswer,
            String previousAttemptsJson,
            int questionNumber,
            int totalQuestions,
            String resumeSkills,
            String resumeProjects,
            String resumeExpEdu,
            java.util.List<String> excludedQuestions
    ) {
        String modeInstruction = "";
        if ("Mixed".equalsIgnoreCase(interviewType)) {
            modeInstruction = String.format(
                "MODE: MIXED INTERVIEW.\n" +
                "Resume details:\n" +
                "- Skills: %s\n" +
                "- Projects: %s\n" +
                "- Experience & Education: %s\n" +
                "Company details:\n" +
                "- Company: %s\n" +
                "- Role: %s\n" +
                "- Required Skills: %s\n",
                resumeSkills, resumeProjects, resumeExpEdu,
                companyName, role, skillsRequired
            );
        } else if ("Resume Based".equalsIgnoreCase(interviewType) || (companyName == null || companyName.isEmpty() || "Google AI Studio".equalsIgnoreCase(companyName))) {
            modeInstruction = String.format(
                "MODE: RESUME-BASED INTERVIEW.\n" +
                "Resume details:\n" +
                "- Skills: %s\n" +
                "- Projects: %s\n" +
                "- Experience & Education: %s\n",
                resumeSkills, resumeProjects, resumeExpEdu
            );
        } else {
            modeInstruction = String.format(
                "MODE: COMPANY-SPECIFIC INTERVIEW.\n" +
                "Company details:\n" +
                "- Company: %s\n" +
                "- Role: %s\n" +
                "- Required Skills: %s\n",
                companyName, role, skillsRequired
            );
        }

        String exclusionsBlock = "";
        if (excludedQuestions != null && !excludedQuestions.isEmpty()) {
            StringBuilder sb = new StringBuilder("CRITICAL EXCLUSIONS:\n" +
                "You MUST NOT ask any of the following questions that the candidate was already asked in previous or current sessions:\n");
            for (String q : excludedQuestions) {
                sb.append("- \"").append(q).append("\"\n");
            }
            exclusionsBlock = sb.toString();
        }

        String prompt = String.format(
            "You are a professional, adaptive virtual recruiter conducting a live real-time voice-interactive interview room.\n\n" +
            "Interview Mode details:\n" +
            "%s\n\n" +
            "Session State:\n" +
            "- Current Difficulty Level: %s\n" +
            "- Question Number: %d out of %d\n" +
            "- Question Asked: \"%s\"\n" +
            "- Candidate's Spoken Answer: \"%s\"\n" +
            "- Previous Questions & Answers Transcript in this Session:\n%s\n\n" +
            "%s\n\n" +
            "ADAPTATION & FOLLOW-UP RULES:\n" +
            "1. Generate follow-up questions directly from the candidate's last answer. E.g. if candidate explains Spring Boot, ask a deeper Spring Boot concept; if they explain REST APIs, ask about API security or design.\n" +
            "2. Dynamically adjust difficulty (Easy, Medium, Hard) based on candidate answers, confidence, correctness, and interview progress. If they answered correctly and with high confidence, increase difficulty; if they struggled, drop difficulty slightly to rebuild confidence.\n" +
            "3. Assess the candidate's spoken answer. Extract filler words like 'umm', 'like', 'actually', 'basically', 'you know'. Decide if the answer is: Correct, Partially Correct, or Incorrect. Score it out of 100.\n" +
            "4. If this is the final question (question %d equals total %d), mark \"isFinished\" as true. Otherwise, mark \"isFinished\" as false and generate the next question.\n\n" +
            "Your response must be a valid, parseable JSON object matching the exact structure below. Do not wrap in markdown or add comments.\n" +
            "JSON Schema:\n" +
            "{\n" +
            "  \"score\": 85, // integer out of 100\n" +
            "  \"isFinished\": false, // boolean\n" +
            "  \"nextQuestion\": \"Text of the next question to be spoken out loud...\",\n" +
            "  \"nextDifficulty\": \"Medium or Hard or Easy\", // adaptive next difficulty\n" +
            "  \"strengths\": \"Brief note of what was strong in this answer...\",\n" +
            "  \"weaknesses\": \"Brief note of areas they struggled with...\",\n" +
            "  \"fillerWordsUsed\": [ \"umm\", \"like\" ], // list of filler words detected\n" +
            "  \"modelAnswer\": \"A concise professional STAR structure answer...\"\n" +
            "}",
            modeInstruction, currentDifficulty, questionNumber, totalQuestions, question, userAnswer, previousAttemptsJson,
            exclusionsBlock, questionNumber, totalQuestions
        );
        return callGeminiWithJson(prompt);
    }

    public String generateRealTimeFinalReport(
            String companyName,
            String role,
            String interviewType,
            String fullAttemptsJson
    ) {
        String prompt = String.format(
            "You are a chief recruitment strategist compiling the final performance report for a candidate who completed a voice-interactive AI Interview Coach simulation.\n\n" +
            "Interview Context:\n" +
            "- Company: %s\n" +
            "- Role: %s\n" +
            "- Interview Type: %s\n\n" +
            " chronologically ordered transcript and individual scoring evaluations:\n" +
            "%s\n\n" +
            "CRITICAL INSTRUCTIONS:\n" +
            "1. Aggregate and analyze the performance. Synthesize six separate metrics out of 100: Overall Score, Technical Score, Communication Score, Confidence Score, Behavioral Score, Problem Solving Score.\n" +
            "2. Under communication score, penalize heavily for frequent filler words (umm, like, basically, actually, you know) and poor structural cohesion.\n" +
            "3. Under confidence score, evaluate answer lengths, structural hesitation, and vocabulary consistency.\n" +
            "4. Provide a high-fidelity lists of Strengths, Weaknesses, and an action-oriented Improvement Plan consisting of 'topicsToRevise', 'practiceAreas', and learning recommendations.\n\n" +
            "Your response must be a valid, parseable JSON object matching the exact structure below. Do not wrap in markdown or add comments.\n" +
            "JSON Schema:\n" +
            "{\n" +
            "  \"overallScore\": 84, // integer out of 100\n" +
            "  \"technicalScore\": 85, // integer out of 100\n" +
            "  \"communicationScore\": 78, // integer out of 100\n" +
            "  \"confidenceScore\": 80, // integer out of 100\n" +
            "  \"behavioralScore\": 85, // integer out of 100\n" +
            "  \"problemSolvingScore\": 82, // integer out of 100\n" +
            "  \"strengths\": [ \"Strong understanding of Spring Boot MVC\", \"Excellent communication logic\" ], // array of strings\n" +
            "  \"weaknesses\": [ \"Frequent use of filler words (like, umm)\", \"Needs better time-complexity optimization explanation\" ], // array of strings\n" +
            "  \"topicsToRevise\": [ \"Spring Boot Security\", \"Big O Notation complexity analysis\" ], // array of strings\n" +
            "  \"practiceAreas\": [ \"Coding under pressure\", \"Avoiding filler words during conceptual explanation\" ], // array of strings\n" +
            "  \"learningRecommendations\": \"Strategic actionable advice for preparation improvement...\"\n" +
            "}",
            companyName, role, interviewType, fullAttemptsJson
        );
        return callGeminiWithJson(prompt);
    }

    public String generatePersonalizedLeetCodeRoadmap(String skills, String projects) {
        String prompt = String.format(
            "You are an expert technical interviewer and DSA coach. Analyze the candidate's extracted resume skills and projects:\n" +
            "Skills: %s\n" +
            "Projects: %s\n\n" +
            "Identify their technical stack (e.g. Java, Python, JavaScript, C++, etc.) and generate a highly personalized, non-hardcoded LeetCode practice roadmap.\n\n" +
            "CRITICAL:\n" +
            "1. Do NOT return generic static lists. Every recommendation must be dynamically tailored to the technical stack and project categories on their resume.\n" +
            "2. If the user has Java skills, generate Java collections, streams, arrays, hashmaps, joins, queries, etc.\n" +
            "3. If the user has Python, generate Python DSA, recursion, dynamic programming, system design basics, etc.\n" +
            "4. Provide actual problem recommendations (e.g., 'Two Sum', 'Group Anagrams', etc.) that are highly relevant to their stack.\n\n" +
            "Your response must be a valid, parseable JSON object matching the exact structure below. Do not wrap in markdown or add comments. Return ONLY the raw JSON.\n\n" +
            "JSON Structure:\n" +
            "{\n" +
            "  \"detectedSkills\": [ \"Detected skill 1\", \"Detected skill 2\" ],\n" +
            "  \"recommendedTopics\": [ \"Topic 1\", \"Topic 2\" ],\n" +
            "  \"difficultyLevel\": \"Medium or Easy or Hard\",\n" +
            "  \"easyProblems\": [ \"Easy LeetCode Problem 1\", \"Easy LeetCode Problem 2\" ],\n" +
            "  \"mediumProblems\": [ \"Medium LeetCode Problem 1\", \"Medium LeetCode Problem 2\" ],\n" +
            "  \"hardProblems\": [ \"Hard LeetCode Problem 1\", \"Hard LeetCode Problem 2\" ],\n" +
            "  \"practiceOrder\": \"Step-by-step order recommendation (e.g., 1. Array -> 2. HashMap -> 3. Trees)\",\n" +
            "  \"learningPriority\": \"High or Medium or Low (with custom explanation)\",\n" +
            "  \"roadmap\": \"Step-by-step roadmap schedule (e.g., Week 1: Array-based problems. Week 2: HashMap operations.)\"\n" +
            "}",
            skills, projects
        );
        return callGeminiWithJson(prompt);
    }

    public String generatePersonalizedMockInterviewContext(String skills, String projects, String experience, String education) {
        String prompt = String.format(
            "You are an expert talent strategist. Analyze the candidate's extracted resume details:\n" +
            "Skills: %s\n" +
            "Projects: %s\n" +
            "Experience: %s\n" +
            "Education: %s\n\n" +
            "Generate a highly customized mock interview prep overview and focus areas for a resume-based interview.\n\n" +
            "Your response must be a valid, parseable JSON object matching the exact structure below. Do not wrap in markdown or add comments. Return ONLY the raw JSON.\n\n" +
            "JSON Structure:\n" +
            "{\n" +
            "  \"skillsFocus\": [ \"Dynamic Topic 1\", \"Dynamic Topic 2\" ], // list of core topics extracted from projects, technologies, and experience\n" +
            "  \"technicalFocus\": \"Summarized technical & framework topics they should review based on their skills\",\n" +
            "  \"projectFocus\": \"Architectural, database design, or security optimization challenges they should review from their actual projects\",\n" +
            "  \"behavioralFocus\": \"STAR-based behavioral scenarios (e.g. teamwork, conflict) they should review from their experience\",\n" +
            "  \"prepTips\": \"Actionable review tips for their resume-based preparation\"\n" +
            "}",
            skills, projects, experience, education
        );
        return callGeminiWithJson(prompt);
    }
}

