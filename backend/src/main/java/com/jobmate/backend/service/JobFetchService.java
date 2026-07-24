package com.jobmate.backend.service;

import com.jobmate.backend.entity.Job;
import com.jobmate.backend.repository.JobRepository;
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
import java.time.ZoneOffset;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobFetchService {

    private static final int MAX_JOB_AGE_DAYS = 3;

    private final JobRepository jobRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${jsearch.api.key:}")
    private String jsearchApiKey;

    @Value("${adzuna.app.id:}")
    private String adzunaAppId;

    @Value("${adzuna.app.key:}")
    private String adzunaAppKey;

    @Value("${jooble.api.key:}")
    private String joobleApiKey;

    @Value("${theirstack.api.key:}")
    private String theirstackApiKey;

    @Value("${themuse.api.key:}")
    private String themuseApiKey;

    @Value("${remotive.base.url:https://remotive.com/api/remote-jobs}")
    private String remotiveBaseUrl;

    @Value("${arbeitnow.base.url:https://www.arbeitnow.com/api/job-board-api}")
    private String arbeitnowBaseUrl;

    @Value("${himalayas.base.url:https://himalayas.app/jobs/api}")
    private String himalayasBaseUrl;

    @Transactional
    public int fetchAndStoreAllJobs() {
        return fetchAndStoreAllJobs(null);
    }

    @Transactional
    public int fetchAndStoreAllJobs(List<String> userSkills) {
        log.info("Starting external job fetching harvest sequence... Wiping old database entries.");
        jobRepository.deleteAll();

        List<Job> allFetchedJobs = new ArrayList<>();

        allFetchedJobs.addAll(fetchFromJSearch(userSkills));
        allFetchedJobs.addAll(fetchFromAdzuna(userSkills));
        if (joobleApiKey == null || joobleApiKey.trim().isEmpty()) {
            log.info("Jooble integration disabled — no API key configured. Skipping.");
        } else {
            allFetchedJobs.addAll(fetchFromJooble(userSkills));
        }
        if (theirstackApiKey == null || theirstackApiKey.trim().isEmpty()) {
            log.info("TheirStack integration disabled â€” no API key configured. Skipping.");
        } else {
            allFetchedJobs.addAll(fetchFromTheirStack(userSkills));
        }
        if (themuseApiKey == null || themuseApiKey.trim().isEmpty()) {
            log.info("The Muse integration disabled â€” no API key configured. Skipping.");
        } else {
            allFetchedJobs.addAll(fetchFromTheMuse(userSkills));
        }
        allFetchedJobs.addAll(fetchFromRemotive(userSkills));
        allFetchedJobs.addAll(fetchFromArbeitnow(userSkills));
        allFetchedJobs.addAll(fetchFromHimalayas(userSkills));

        List<Job> skillMatchedJobs = filterBySkills(allFetchedJobs, userSkills);
        List<Job> uniqueJobs = removeDuplicateJobs(skillMatchedJobs);
        if (!uniqueJobs.isEmpty()) {
            saveJobs(uniqueJobs);
        }

        log.info("Job fetching sequence completed. Fetched: {}, Skill matched: {}, Unique Saved: {}",
                allFetchedJobs.size(), skillMatchedJobs.size(), uniqueJobs.size());
        return uniqueJobs.size();
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

    private String buildQueryString(List<String> userSkills) {
        if (userSkills != null && !userSkills.isEmpty()) {
            List<String> cleanedSkills = userSkills.stream()
                    .filter(skill -> skill != null && !skill.trim().isEmpty())
                    .map(String::trim)
                    .limit(5)
                    .collect(Collectors.toList());

            if (!cleanedSkills.isEmpty()) {
                return String.join(" ", cleanedSkills);
            }
        }
        return "Java Developer React Developer Frontend Developer Database Developer Startup MNC";
    }

    public List<Job> fetchFromJSearch(List<String> userSkills) {
        log.info("Fetching jobs from JSearch API...");
        List<Job> fetched = new ArrayList<>();

        if (jsearchApiKey == null || jsearchApiKey.trim().isEmpty()) {
            log.warn("JSearch API Key is missing. Skipping this source.");
            return fetched;
        }

        try {
            String queryStr = buildQueryString(userSkills);
            String url = "https://jsearch.p.rapidapi.com/search?query=" + java.net.URLEncoder.encode(queryStr, java.nio.charset.StandardCharsets.UTF_8) + "&num_pages=1";
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-RapidAPI-Key", jsearchApiKey);
            headers.set("X-RapidAPI-Host", "jsearch.p.rapidapi.com");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
                if (data != null) {
                    for (Map<String, Object> jobMap : data) {
                        LocalDate postedDate = extractPostedDate(jobMap);
                        if (postedDate == null || isOlderThanWindow(postedDate)) {
                            continue;
                        }

                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.get("job_title"))
                                .companyName((String) jobMap.get("employer_name"))
                                .location(buildLocation((String) jobMap.get("job_city"), (String) jobMap.get("job_country")))
                                .salary("Not Disclosed")
                                .experience(inferExperience((String) jobMap.get("job_title"), (String) jobMap.get("job_description")))
                                .jobType("Full Time")
                                .workMode("Hybrid")
                                .jobSource("JSearch")
                                .jobUrl((String) jobMap.get("job_apply_link"))
                                .description((String) jobMap.get("job_description"))
                                .skillsRequired("Java, React, SQL")
                                .postedDate(postedDate)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("JSearch API call failed: {}. Returning empty list.", e.getMessage());
            return fetched;
        }

        return fetched;
    }

    public List<Job> fetchFromAdzuna(List<String> userSkills) {
        log.info("Fetching jobs from Adzuna API...");
        List<Job> fetched = new ArrayList<>();

        if (adzunaAppId == null || adzunaAppId.trim().isEmpty() || adzunaAppKey == null || adzunaAppKey.trim().isEmpty()) {
            log.warn("Adzuna API Credentials missing. Skipping this source.");
            return fetched;
        }

        try {
            String queryStr = buildQueryString(userSkills);
            String url = String.format("https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=%s&app_key=%s&what=%s",
                    adzunaAppId, adzunaAppKey, java.net.URLEncoder.encode(queryStr, java.nio.charset.StandardCharsets.UTF_8));

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
                if (results != null) {
                    for (Map<String, Object> jobMap : results) {
                        LocalDate postedDate = extractPostedDate(jobMap);
                        if (postedDate == null || isOlderThanWindow(postedDate)) {
                            continue;
                        }

                        Map<String, Object> companyMap = (Map<String, Object>) jobMap.get("company");
                        String company = companyMap != null ? (String) companyMap.get("display_name") : "Tech Corp";

                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.get("title"))
                                .companyName(company)
                                .location("India")
                                .salary("Competitive")
                                .experience(inferExperience((String) jobMap.get("title"), (String) jobMap.get("description")))
                                .jobType("Full Time")
                                .workMode("Remote")
                                .jobSource("Adzuna")
                                .jobUrl((String) jobMap.get("redirect_url"))
                                .description((String) jobMap.get("description"))
                                .skillsRequired("Python, Django, AWS")
                                .postedDate(postedDate)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Adzuna API call failed: {}. Returning empty list.", e.getMessage());
            return fetched;
        }

        return fetched;
    }

    public List<Job> fetchFromJooble(List<String> userSkills) {
        log.info("Fetching jobs from Jooble API...");
        List<Job> fetched = new ArrayList<>();

        if (joobleApiKey == null || joobleApiKey.trim().isEmpty()) {
            log.info("Jooble integration disabled — no API key configured. Skipping.");
            return fetched;
        }

        try {
            String url = "https://jooble.org/api/" + joobleApiKey;
            String queryStr = buildQueryString(userSkills);
            Map<String, String> requestBody = Map.of("keywords", queryStr, "location", "India");

            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestBody, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.getBody().get("jobs");
                if (jobs != null) {
                    for (Map<String, Object> jobMap : jobs) {
                        LocalDate postedDate = extractPostedDate(jobMap);
                        if (postedDate == null || isOlderThanWindow(postedDate)) {
                            continue;
                        }

                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.get("title"))
                                .companyName((String) jobMap.get("company"))
                                .location((String) jobMap.get("location"))
                                .salary("Not Disclosed")
                                .experience(inferExperience((String) jobMap.get("title"), (String) jobMap.get("snippet")))
                                .jobType("Full Time")
                                .workMode("Onsite")
                                .jobSource("Jooble")
                                .jobUrl((String) jobMap.get("link"))
                                .description((String) jobMap.get("snippet"))
                                .skillsRequired("Java, Spring Boot, Microservices")
                                .postedDate(postedDate)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Jooble API call failed: {}. Returning empty list.", e.getMessage());
            return fetched;
        }

        return fetched;
    }

    public List<Job> fetchFromTheirStack(List<String> userSkills) {
        log.info("Fetching jobs from TheirStack API...");
        List<Job> fetched = new ArrayList<>();

        if (theirstackApiKey == null || theirstackApiKey.trim().isEmpty()) {
            log.info("TheirStack integration disabled â€” no API key configured. Skipping.");
            return fetched;
        }

        try {
            String queryStr = buildQueryString(userSkills);
            // ASSUMPTION: TheirStack supports keyword search through this endpoint and q parameter.
            String url = "https://api.theirstack.com/v1/jobs/search?q="
                    + java.net.URLEncoder.encode(queryStr, java.nio.charset.StandardCharsets.UTF_8)
                    + "&limit=20";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + theirstackApiKey);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // ASSUMPTION: TheirStack returns jobs under a top-level data array.
                List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.getBody().get("data");
                if (jobs != null) {
                    for (Map<String, Object> jobMap : jobs) {
                        LocalDate postedDate = extractPostedDate(jobMap);
                        if (postedDate == null || isOlderThanWindow(postedDate)) {
                            continue;
                        }

                        // ASSUMPTION: adjust field names based on actual TheirStack API response structure.
                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.getOrDefault("title", jobMap.getOrDefault("job_title", "Unknown Role")))
                                .companyName((String) jobMap.getOrDefault("company_name", jobMap.getOrDefault("company", "Unknown Company")))
                                .location((String) jobMap.getOrDefault("location", "Remote"))
                                .salary((String) jobMap.getOrDefault("salary", "Not Disclosed"))
                                .experience(inferExperience((String) jobMap.getOrDefault("title", jobMap.getOrDefault("job_title", null)), (String) jobMap.getOrDefault("description", jobMap.getOrDefault("job_description", null))))
                                .jobType((String) jobMap.getOrDefault("job_type", "Full Time"))
                                .workMode((String) jobMap.getOrDefault("work_mode", "Remote"))
                                .jobSource("TheirStack")
                                .jobUrl((String) jobMap.getOrDefault("url", jobMap.getOrDefault("job_url", "")))
                                .description((String) jobMap.getOrDefault("description", jobMap.getOrDefault("job_description", "")))
                                .skillsRequired((String) jobMap.getOrDefault("skills_required", buildQueryString(userSkills)))
                                .companyLogo((String) jobMap.get("company_logo"))
                                .postedDate(postedDate)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("TheirStack API call failed: {}. Returning empty list.", e.getMessage());
        }

        return fetched;
    }

    public List<Job> fetchFromTheMuse(List<String> userSkills) {
        log.info("Fetching jobs from The Muse API...");
        List<Job> fetched = new ArrayList<>();

        if (themuseApiKey == null || themuseApiKey.trim().isEmpty()) {
            log.info("The Muse integration disabled â€” no API key configured. Skipping.");
            return fetched;
        }

        try {
            String queryStr = buildQueryString(userSkills);
            // ASSUMPTION: The Muse supports search via query-string parameters on this endpoint.
            String url = "https://www.themuse.com/api/public/jobs?api_key="
                    + java.net.URLEncoder.encode(themuseApiKey, java.nio.charset.StandardCharsets.UTF_8)
                    + "&page=1&descending=true"
                    + "&category=" + java.net.URLEncoder.encode(queryStr, java.nio.charset.StandardCharsets.UTF_8);

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // ASSUMPTION: The Muse returns jobs under a top-level results or data array.
                List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.getBody().get("results");
                if (jobs == null) {
                    jobs = (List<Map<String, Object>>) response.getBody().get("data");
                }
                if (jobs != null) {
                    for (Map<String, Object> jobMap : jobs) {
                        LocalDate postedDate = extractPostedDate(jobMap);
                        if (postedDate == null || isOlderThanWindow(postedDate)) {
                            continue;
                        }

                        Map<String, Object> companyMap = (Map<String, Object>) jobMap.get("company");
                        String companyName = companyMap != null
                                ? (String) companyMap.getOrDefault("name", "Unknown Company")
                                : (String) jobMap.getOrDefault("company_name", "Unknown Company");
                        String jobTitle = (String) jobMap.getOrDefault("name", jobMap.getOrDefault("title", "Unknown Role"));
                        String location = (String) jobMap.getOrDefault("location", "Remote");
                        String description = (String) jobMap.getOrDefault("contents", jobMap.getOrDefault("description", ""));
                        String jobUrl = (String) jobMap.getOrDefault("refs", jobMap.getOrDefault("job_url", ""));

                        fetched.add(Job.builder()
                                .jobTitle(jobTitle)
                                .companyName(companyName)
                                .location(location)
                                .salary((String) jobMap.getOrDefault("salary", "Not Disclosed"))
                                .experience(inferExperience((String) jobMap.getOrDefault("name", jobMap.getOrDefault("title", null)), (String) jobMap.getOrDefault("contents", jobMap.getOrDefault("description", null))))
                                .jobType((String) jobMap.getOrDefault("job_type", "Full Time"))
                                .workMode((String) jobMap.getOrDefault("work_mode", "Hybrid"))
                                .jobSource("The Muse")
                                .jobUrl(jobUrl)
                                .description(description)
                                .skillsRequired(buildQueryString(userSkills))
                                .companyLogo((String) jobMap.get("company_logo"))
                                .postedDate(postedDate)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("The Muse API call failed: {}. Returning empty list.", e.getMessage());
        }

        return fetched;
    }

    public List<Job> fetchFromRemotive(List<String> userSkills) {
        log.info("Fetching jobs from Remotive API...");
        List<Job> fetched = new ArrayList<>();

        try {
            String queryStr = buildQueryString(userSkills);
            String url = remotiveBaseUrl + "?search=" + java.net.URLEncoder.encode(queryStr, java.nio.charset.StandardCharsets.UTF_8);

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.getBody().get("jobs");
                if (jobs != null) {
                    for (Map<String, Object> jobMap : jobs) {
                        LocalDate postedDate = extractPostedDate(jobMap);
                        if (postedDate == null || isOlderThanWindow(postedDate)) {
                            continue;
                        }

                        Object tags = jobMap.get("tags");
                        String skills = tags != null ? tags.toString() : buildQueryString(userSkills);

                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.getOrDefault("title", "Unknown Role"))
                                .companyName((String) jobMap.getOrDefault("company_name", "Unknown Company"))
                                .location((String) jobMap.getOrDefault("candidate_required_location", "Remote"))
                                .salary((String) jobMap.getOrDefault("salary", "Not Disclosed"))
                                .experience(inferExperience((String) jobMap.getOrDefault("title", null), (String) jobMap.getOrDefault("description", null)))
                                .jobType((String) jobMap.getOrDefault("job_type", "Full Time"))
                                .workMode((String) jobMap.getOrDefault("job_type", "Remote"))
                                .jobSource("Remotive")
                                .jobUrl((String) jobMap.getOrDefault("url", ""))
                                .description((String) jobMap.getOrDefault("description", ""))
                                .skillsRequired(skills)
                                .companyLogo((String) jobMap.get("company_logo"))
                                .postedDate(postedDate)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Remotive API call failed: {}. Returning empty list.", e.getMessage());
        }

        return fetched;
    }

    public List<Job> fetchFromArbeitnow(List<String> userSkills) {
        log.info("Fetching jobs from Arbeitnow API...");
        List<Job> fetched = new ArrayList<>();

        try {
            String queryStr = buildQueryString(userSkills);
            String url = arbeitnowBaseUrl + "/jobs?search=" + java.net.URLEncoder.encode(queryStr, java.nio.charset.StandardCharsets.UTF_8);

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // ASSUMPTION: Arbeitnow returns jobs under a top-level data or jobs array.
                List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.getBody().get("data");
                if (jobs == null) {
                    jobs = (List<Map<String, Object>>) response.getBody().get("jobs");
                }
                if (jobs != null) {
                    for (Map<String, Object> jobMap : jobs) {
                        LocalDate postedDate = extractPostedDate(jobMap);
                        if (postedDate == null || isOlderThanWindow(postedDate)) {
                            continue;
                        }

                        Object tags = jobMap.get("tags");
                        String skills = tags != null ? tags.toString() : buildQueryString(userSkills);

                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.getOrDefault("title", "Unknown Role"))
                                .companyName((String) jobMap.getOrDefault("company_name", "Unknown Company"))
                                .location((String) jobMap.getOrDefault("location", "Remote"))
                                .salary((String) jobMap.getOrDefault("salary", "Not Disclosed"))
                                .experience(inferExperience((String) jobMap.getOrDefault("title", null), (String) jobMap.getOrDefault("description", null)))
                                .jobType((String) jobMap.getOrDefault("job_type", "Full Time"))
                                .workMode((String) jobMap.getOrDefault("work_mode", "Remote"))
                                .jobSource("Arbeitnow")
                                .jobUrl((String) jobMap.getOrDefault("url", ""))
                                .description((String) jobMap.getOrDefault("description", ""))
                                .skillsRequired(skills)
                                .companyLogo((String) jobMap.get("company_logo"))
                                .postedDate(postedDate)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Arbeitnow API call failed: {}. Returning empty list.", e.getMessage());
        }

        return fetched;
    }

    public List<Job> fetchFromHimalayas(List<String> userSkills) {
        log.info("Fetching jobs from Himalayas API...");
        List<Job> fetched = new ArrayList<>();

        try {
            String queryStr = buildQueryString(userSkills);
            String url = himalayasBaseUrl + "?keyword=" + java.net.URLEncoder.encode(queryStr, java.nio.charset.StandardCharsets.UTF_8) + "&page=1";

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // ASSUMPTION: Himalayas returns listings under a top-level array field; verify against the live response if this key differs.
                List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.getBody().get("jobs");
                if (jobs != null) {
                    for (Map<String, Object> jobMap : jobs) {
                        LocalDate postedDate = extractPostedDate(jobMap);
                        if (postedDate == null || isOlderThanWindow(postedDate)) {
                            continue;
                        }

                        Object tags = jobMap.get("tags");
                        String skills = tags != null ? tags.toString() : buildQueryString(userSkills);

                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.getOrDefault("title", "Unknown Role"))
                                .companyName((String) jobMap.getOrDefault("company_name", "Unknown Company"))
                                .location((String) jobMap.getOrDefault("location", "Remote"))
                                .salary((String) jobMap.getOrDefault("salary", "Not Disclosed"))
                                .experience(inferExperience((String) jobMap.getOrDefault("title", null), (String) jobMap.getOrDefault("description", null)))
                                .jobType((String) jobMap.getOrDefault("job_type", "Full Time"))
                                .workMode((String) jobMap.getOrDefault("work_mode", "Remote"))
                                .jobSource("Himalayas")
                                .jobUrl((String) jobMap.getOrDefault("url", ""))
                                .description((String) jobMap.getOrDefault("description", ""))
                                .skillsRequired(skills)
                                .companyLogo((String) jobMap.get("company_logo"))
                                .postedDate(postedDate)
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Himalayas API call failed: {}. Returning empty list.", e.getMessage());
        }

        return fetched;
    }

    private LocalDate extractPostedDate(Map<String, Object> jobMap) {
        if (jobMap == null || jobMap.isEmpty()) {
            return null;
        }

        Object[] candidates = new Object[] {
                jobMap.get("job_posted_at_timestamp"),
                jobMap.get("job_posted_at_datetime_utc"),
                jobMap.get("job_posted_at"),
                jobMap.get("created"),
                jobMap.get("created_at"),
                jobMap.get("published"),
                jobMap.get("publication_date"),
                jobMap.get("date")
        };

        for (Object candidate : candidates) {
            LocalDate parsed = parsePostedDate(candidate);
            if (parsed != null) {
                return parsed;
            }
        }
        return null;
    }

    private LocalDate parsePostedDate(Object candidate) {
        if (candidate == null) {
            return null;
        }

        try {
            if (candidate instanceof Number number) {
                long raw = number.longValue();
                if (raw > 1_000_000_000_000L) {
                    return Instant.ofEpochMilli(raw).atZone(ZoneOffset.UTC).toLocalDate();
                }
                return Instant.ofEpochSecond(raw).atZone(ZoneOffset.UTC).toLocalDate();
            }

            String value = candidate.toString().trim();
            if (value.isEmpty()) {
                return null;
            }

            if (value.matches("^\\d+$")) {
                long raw = Long.parseLong(value);
                if (raw > 1_000_000_000_000L) {
                    return Instant.ofEpochMilli(raw).atZone(ZoneOffset.UTC).toLocalDate();
                }
                return Instant.ofEpochSecond(raw).atZone(ZoneOffset.UTC).toLocalDate();
            }

            try {
                return LocalDate.parse(value);
            } catch (Exception ignored) {
            }

            try {
                return java.time.OffsetDateTime.parse(value).toLocalDate();
            } catch (Exception ignored) {
            }

            try {
                return java.time.ZonedDateTime.parse(value).toLocalDate();
            } catch (Exception ignored) {
            }

            try {
                return java.time.OffsetDateTime.parse(value.replace(" ", "T")).toLocalDate();
            } catch (Exception ignored) {
            }
        } catch (Exception e) {
            log.debug("Unable to parse posted date value: {}", candidate);
        }

        return null;
    }

    private boolean isOlderThanWindow(LocalDate postedDate) {
        return postedDate.isBefore(LocalDate.now().minusDays(MAX_JOB_AGE_DAYS));
    }

    public List<Job> removeDuplicateJobs(List<Job> jobs) {
        List<Job> uniqueJobs = new ArrayList<>();
        for (Job job : jobs) {
            String jobUrl = job.getJobUrl() != null ? job.getJobUrl() : "";
            boolean dbDuplicate = jobRepository.existsByCompanyNameAndJobTitleAndLocationAndPostedDateAndJobUrl(
                    job.getCompanyName(), job.getJobTitle(), job.getLocation(), job.getPostedDate(), jobUrl);

            boolean batchDuplicate = uniqueJobs.stream().anyMatch(uj ->
                    uj.getCompanyName().equalsIgnoreCase(job.getCompanyName()) &&
                    uj.getJobTitle().equalsIgnoreCase(job.getJobTitle()) &&
                    uj.getLocation().equalsIgnoreCase(job.getLocation()) &&
                    uj.getPostedDate().equals(job.getPostedDate()) &&
                    ((uj.getJobUrl() == null ? "" : uj.getJobUrl()).equalsIgnoreCase(jobUrl))
            );

            if (!dbDuplicate && !batchDuplicate) {
                uniqueJobs.add(job);
            }
        }
        return uniqueJobs;
    }

    @Transactional
    public void saveJobs(List<Job> jobs) {
        jobRepository.saveAll(jobs);
        log.info("Successfully persisted {} unique new job listings.", jobs.size());
    }

    private List<Job> filterBySkills(List<Job> jobs, List<String> userSkills) {
        if (userSkills == null || userSkills.isEmpty()) {
            Set<String> normalizedSkills = new HashSet<>();
            List<String> allowedRoles = Arrays.asList("frontend developer", "java developer", "react developer", "database developer", "frontend", "java", "react", "database");
            normalizedSkills.addAll(allowedRoles);

            return jobs.stream()
                    .filter(job -> jobMatchesSkills(job, normalizedSkills))
                    .collect(Collectors.toList());
        }

        List<String> normalizedUserSkills = userSkills.stream()
                .filter(skill -> skill != null && !skill.trim().isEmpty())
                .map(skill -> skill.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toList());

        return jobs.stream()
                .filter(job -> jobMatchesUserSkills(job, normalizedUserSkills))
                .collect(Collectors.toList());
    }

    private boolean jobMatchesSkills(Job job, Set<String> userSkills) {
        if (job == null || job.getJobTitle() == null) return false;

        String title = job.getJobTitle().toLowerCase(Locale.ROOT);
        if (title.contains("frontend") || title.contains("java") || 
            title.contains("react") || title.contains("database")) {
            return true;
        }

        String haystack = " " + (title + " " + job.getDescription() + " " + job.getSkillsRequired())
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9#+.]", " ") + " ";

        for (String skill : userSkills) {
            if (skill.isBlank()) continue;
            if (haystack.contains(" " + skill + " ")) {
                return true;
            }
        }
        return false;
    }

    private boolean jobMatchesUserSkills(Job job, List<String> userSkills) {
        if (job == null) return false;

        String haystack = ((job.getJobTitle() != null ? job.getJobTitle() : "") + " " +
                (job.getDescription() != null ? job.getDescription() : "") + " " +
                (job.getSkillsRequired() != null ? job.getSkillsRequired() : ""))
                .toLowerCase(Locale.ROOT);

        for (String skill : userSkills) {
            if (haystack.contains(skill)) {
                return true;
            }
        }
        return false;
    }

}
