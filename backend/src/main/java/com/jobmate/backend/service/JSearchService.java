package com.jobmate.backend.service;

import com.jobmate.backend.entity.Job;
import com.jobmate.backend.entity.SkillsMaster;
import com.jobmate.backend.repository.JobRepository;
import com.jobmate.backend.repository.SkillsMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JSearchService {

    private final JobRepository jobRepository;
    private final SkillsMasterRepository skillsMasterRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${jsearch.api.key:}")
    private String jsearchApiKey;

    @Value("${jsearch.base.url:https://api.openwebninja.com/jsearch}")
    private String jsearchBaseUrl;

    // Legacy support delegate methods
    public List<Job> fetchJobsBySkill(String skill) {
        return searchJobs(skill);
    }

    public List<Job> fetchJobsBySkills(List<String> skills) {
        return searchJobsBySkills(skills);
    }

    public List<String> generateQueries(List<String> skills) {
        List<String> queries = new ArrayList<>();
        if (skills == null || skills.isEmpty()) {
            queries.add("Software Engineer");
            return queries;
        }

        // Add developer queries for top skills
        int added = 0;
        for (String skill : skills) {
            if (added < 2) {
                queries.add(skill + " Developer");
                added++;
            }
        }

        // Categorization based queries
        boolean hasBackend = false;
        boolean hasFrontend = false;
        List<String> backendKeywords = Arrays.asList("java", "spring", "python", "node", "go", "c++", "c#", "mysql", "sql", "postgres", "django", "express", "backend");
        List<String> frontendKeywords = Arrays.asList("react", "angular", "vue", "javascript", "typescript", "html", "css", "flutter", "ios", "android", "frontend");

        for (String skill : skills) {
            String lower = skill.toLowerCase();
            for (String bk : backendKeywords) {
                if (lower.contains(bk)) {
                    hasBackend = true;
                    break;
                }
            }
            for (String fk : frontendKeywords) {
                if (lower.contains(fk)) {
                    hasFrontend = true;
                    break;
                }
            }
        }

        if (hasBackend) {
            queries.add("Backend Developer");
        }
        queries.add("Software Engineer");
        if (hasBackend && hasFrontend) {
            queries.add("Full Stack Developer");
        } else if (hasFrontend) {
            queries.add("Frontend Developer");
        }

        return queries.stream().distinct().collect(Collectors.toList());
    }

    public List<Job> searchJobs(String query) {
        log.info("Requesting OpenWeb Ninja JSearch with query: {}", query);
        List<Job> fetched = new ArrayList<>();

        if (jsearchApiKey == null || jsearchApiKey.trim().isEmpty()) {
            log.warn("JSearch API Key is missing. Skipping direct API call.");
            return fetched;
        }

        try {
            String baseUrl = jsearchBaseUrl != null && !jsearchBaseUrl.isEmpty() ? jsearchBaseUrl.trim() : "https://api.openwebninja.com/jsearch";
            String url = baseUrl + "/search?query=" + java.net.URLEncoder.encode(query + " in India", "UTF-8") + "&num_pages=1";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-api-key", jsearchApiKey.trim());

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
                if (data != null) {
                    for (Map<String, Object> jobMap : data) {
                        String jobId = (String) jobMap.get("job_id");
                        if (jobId == null || jobId.trim().isEmpty()) {
                            continue;
                        }

                        String skillsStr = "";
                        List<String> requiredSkills = (List<String>) jobMap.get("job_required_skills");
                        if (requiredSkills != null && !requiredSkills.isEmpty()) {
                            skillsStr = String.join(", ", requiredSkills);
                        } else {
                            String jobTitle = (String) jobMap.get("job_title");
                            String jobDesc = (String) jobMap.get("job_description");
                            Set<String> extractedSkills = extractSkillsFromJobText(jobTitle + " " + jobDesc);
                            if (!extractedSkills.isEmpty()) {
                                skillsStr = String.join(", ", extractedSkills);
                            } else {
                                skillsStr = "Java, React, SQL"; // fallback standard
                            }
                        }

                        String salaryStr = "Not Disclosed";
                        if (jobMap.get("job_min_salary") != null && jobMap.get("job_max_salary") != null) {
                            salaryStr = "₹" + jobMap.get("job_min_salary") + " - ₹" + jobMap.get("job_max_salary") + " / yr";
                        }

                        String workMode = "Onsite";
                        if (Boolean.TRUE.equals(jobMap.get("job_is_remote"))) {
                            workMode = "Remote";
                        } else {
                            workMode = "Hybrid"; // default premium hybrid mode
                        }

                        String jobType = (String) jobMap.get("job_employment_type");
                        if (jobType == null) jobType = "Full Time";

                        String companyLogo = (String) jobMap.get("employer_logo");
                        if (companyLogo == null || companyLogo.trim().isEmpty()) {
                            companyLogo = "";
                        }

                        String source = (String) jobMap.get("job_publisher");
                        if (source == null) source = "JSearch";

                        LocalDate postedDate = LocalDate.now();
                        if (jobMap.get("job_posted_at_timestamp") != null) {
                            try {
                                long seconds = ((Number) jobMap.get("job_posted_at_timestamp")).longValue();
                                postedDate = java.time.Instant.ofEpochSecond(seconds)
                                        .atZone(java.time.ZoneId.systemDefault())
                                        .toLocalDate();
                            } catch (Exception e) {
                                log.warn("Failed to parse posted timestamp, using fallback today");
                            }
                        }

                        // Upsert logic!
                        Optional<Job> existingOpt = jobRepository.findByJobId(jobId);
                        Job jobToSave;
                        if (existingOpt.isPresent()) {
                            jobToSave = existingOpt.get();
                            jobToSave.setJobTitle((String) jobMap.get("job_title"));
                            jobToSave.setCompanyName((String) jobMap.get("employer_name"));
                            jobToSave.setLocation(buildLocation((String) jobMap.get("job_city"), (String) jobMap.get("job_country")));
                            jobToSave.setSalary(salaryStr);
                            jobToSave.setEmploymentType(jobType);
                            jobToSave.setJobType(jobType); // keep legacy aligned
                            jobToSave.setJobUrl((String) jobMap.get("job_apply_link"));
                            jobToSave.setDescription((String) jobMap.get("job_description"));
                            jobToSave.setCompanyLogo(companyLogo);
                            jobToSave.setSource(source);
                            jobToSave.setJobSource(source); // keep legacy aligned
                            jobToSave.setPostedDate(postedDate);
                            jobToSave.setUpdatedAt(LocalDateTime.now());
                        } else {
                            jobToSave = Job.builder()
                                    .jobId(jobId)
                                    .jobTitle((String) jobMap.get("job_title"))
                                    .companyName((String) jobMap.get("employer_name"))
                                    .location(buildLocation((String) jobMap.get("job_city"), (String) jobMap.get("job_country")))
                                    .salary(salaryStr)
                                    .experience(inferExperience((String) jobMap.get("job_title"), (String) jobMap.get("job_description")))
                                    .employmentType(jobType)
                                    .jobType(jobType) // keep legacy aligned
                                    .workMode(workMode)
                                    .jobUrl((String) jobMap.get("job_apply_link"))
                                    .description((String) jobMap.get("job_description"))
                                    .skillsRequired(skillsStr)
                                    .companyLogo(companyLogo)
                                    .source(source)
                                    .jobSource(source) // keep legacy aligned
                                    .postedDate(postedDate)
                                    .createdAt(LocalDateTime.now())
                                    .build();
                        }
                        
                        Job saved = jobRepository.save(jobToSave);
                        fetched.add(saved);
                    }
                }
            }
        } catch (Exception e) {
            log.error("JSearch OpenWeb Ninja direct call failed: {}", e.getMessage(), e);
        }

        return fetched;
    }

    private String buildLocation(String city, String country) {
        boolean hasCity = city != null && !city.trim().isEmpty() && !"null".equalsIgnoreCase(city.trim());
        boolean hasCountry = country != null && !country.trim().isEmpty() && !"null".equalsIgnoreCase(country.trim());
        if (hasCity && hasCountry) return city.trim() + ", " + country.trim();
        if (hasCity) return city.trim();
        if (hasCountry) return country.trim();
        return "Location Not Specified";
    }

    private String inferExperience(String title, String description) {
        String text = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase();
        if (text.contains("senior") || text.contains("sr.") || text.contains("lead ") || text.contains("principal")) {
            return "5+ years";
        }
        if (text.contains("mid-level") || text.contains("mid level") || text.contains("3-5 years") || text.contains("3+ years")) {
            return "3 - 5 years";
        }
        if (text.contains("fresher") || text.contains("entry level") || text.contains("entry-level") || text.contains("trainee") || text.contains("intern")) {
            return "0 - 1 years";
        }
        return "0 - 3 years";
    }

    @Transactional
    public List<Job> searchJobsBySkills(List<String> skills) {
        log.info("Automatic OpenWeb Ninja JSearch harvest: skills list {}", skills);
        List<String> queries = generateQueries(skills);
        List<Job> allFetched = new ArrayList<>();

        // limit to top 3 search queries to prevent RapidAPI rate limit/quota starvation
        List<String> limitedQueries = queries.stream().limit(3).collect(Collectors.toList());

        for (String query : limitedQueries) {
            try {
                List<Job> fetched = searchJobs(query);
                allFetched.addAll(fetched);
                // Pause slightly to respect rate limits
                Thread.sleep(500);
            } catch (Exception e) {
                log.error("Failed to harvest jobs for search query: {}", query, e);
            }
        }

        log.info("Direct JSearch harvest completed. Total jobs parsed/saved: {}", allFetched.size());
        return allFetched;
    }

    private Set<String> extractSkillsFromJobText(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return new HashSet<>();
        }

        List<SkillsMaster> allSkills = skillsMasterRepository.findAll();
        Set<String> matchedSkills = new LinkedHashSet<>();
        String cleanText = " " + rawText.toLowerCase().replaceAll("[^a-z0-9#+.]", " ") + " ";

        for (SkillsMaster sm : allSkills) {
            String skillName = sm.getSkillName();
            String skillLower = skillName.toLowerCase().trim();

            if (skillLower.equals("c") || skillLower.equals("go") || skillLower.equals("r")) {
                Pattern pattern = Pattern.compile("\\b" + Pattern.quote(skillLower) + "\\b");
                if (pattern.matcher(cleanText).find()) {
                    matchedSkills.add(skillName);
                }
            } else if (skillLower.equals("c++")) {
                if (cleanText.contains(" c++ ") || cleanText.contains(" cpp ")) {
                    matchedSkills.add(skillName);
                }
            } else if (skillLower.equals("c#")) {
                if (cleanText.contains(" c# ") || cleanText.contains(" csharp ")) {
                    matchedSkills.add(skillName);
                }
            } else if (skillLower.equals(".net")) {
                if (cleanText.contains(" .net ") || cleanText.contains(" dotnet ")) {
                    matchedSkills.add(skillName);
                }
            } else {
                if (cleanText.contains(" " + skillLower + " ")) {
                    matchedSkills.add(skillName);
                }
            }
        }

        return matchedSkills;
    }
}

