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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobFetchService {

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

    @Transactional
    public int fetchAndStoreAllJobs() {
        log.info("Starting external job fetching harvest sequence...");
        List<Job> allFetchedJobs = new ArrayList<>();

        allFetchedJobs.addAll(fetchFromJSearch());
        allFetchedJobs.addAll(fetchFromAdzuna());
        allFetchedJobs.addAll(fetchFromJooble());

        List<Job> uniqueJobs = removeDuplicateJobs(allFetchedJobs);
        if (!uniqueJobs.isEmpty()) {
            saveJobs(uniqueJobs);
        }

        log.info("Job fetching sequence completed. Fetched: {}, Unique Saved: {}", allFetchedJobs.size(), uniqueJobs.size());
        return uniqueJobs.size();
    }

    public List<Job> fetchFromJSearch() {
        log.info("Fetching jobs from JSearch API...");
        List<Job> fetched = new ArrayList<>();

        if (jsearchApiKey == null || jsearchApiKey.trim().isEmpty()) {
            log.warn("JSearch API Key is missing. Triggering premium fallback simulation...");
            return getJSearchMockData();
        }

        try {
            String url = "https://jsearch.p.rapidapi.com/search?query=Software%20Engineer%20in%20India&num_pages=1";
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-RapidAPI-Key", jsearchApiKey);
            headers.set("X-RapidAPI-Host", "jsearch.p.rapidapi.com");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
                if (data != null) {
                    for (Map<String, Object> jobMap : data) {
                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.get("job_title"))
                                .companyName((String) jobMap.get("employer_name"))
                                .location((String) jobMap.get("job_city") + ", " + (String) jobMap.get("job_country"))
                                .salary("Not Disclosed")
                                .experience("0 - 3 years")
                                .jobType("Full Time")
                                .workMode("Hybrid")
                                .jobSource("JSearch")
                                .jobUrl((String) jobMap.get("job_apply_link"))
                                .description((String) jobMap.get("job_description"))
                                .skillsRequired("Java, React, SQL")
                                .postedDate(LocalDate.now())
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("JSearch API call failed: {}. Triggering mock fallback...", e.getMessage());
            return getJSearchMockData();
        }

        return fetched;
    }

    public List<Job> fetchFromAdzuna() {
        log.info("Fetching jobs from Adzuna API...");
        List<Job> fetched = new ArrayList<>();

        if (adzunaAppId == null || adzunaAppId.trim().isEmpty() || adzunaAppKey == null || adzunaAppKey.trim().isEmpty()) {
            log.warn("Adzuna API Credentials missing. Triggering premium fallback simulation...");
            return getAdzunaMockData();
        }

        try {
            String url = String.format("https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=%s&app_key=%s&what=software%%20developer",
                    adzunaAppId, adzunaAppKey);

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.getBody().get("results");
                if (results != null) {
                    for (Map<String, Object> jobMap : results) {
                        Map<String, Object> companyMap = (Map<String, Object>) jobMap.get("company");
                        String company = companyMap != null ? (String) companyMap.get("display_name") : "Tech Corp";

                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.get("title"))
                                .companyName(company)
                                .location("India")
                                .salary("Competitive")
                                .experience("1 - 4 years")
                                .jobType("Full Time")
                                .workMode("Remote")
                                .jobSource("Adzuna")
                                .jobUrl((String) jobMap.get("redirect_url"))
                                .description((String) jobMap.get("description"))
                                .skillsRequired("Python, Django, AWS")
                                .postedDate(LocalDate.now())
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Adzuna API call failed: {}. Triggering mock fallback...", e.getMessage());
            return getAdzunaMockData();
        }

        return fetched;
    }

    public List<Job> fetchFromJooble() {
        log.info("Fetching jobs from Jooble API...");
        List<Job> fetched = new ArrayList<>();

        if (joobleApiKey == null || joobleApiKey.trim().isEmpty()) {
            log.warn("Jooble API Key is missing. Triggering premium fallback simulation...");
            return getJoobleMockData();
        }

        try {
            String url = "https://jooble.org/api/" + joobleApiKey;
            Map<String, String> requestBody = Map.of("keywords", "software development", "location", "India");

            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestBody, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> jobs = (List<Map<String, Object>>) response.getBody().get("jobs");
                if (jobs != null) {
                    for (Map<String, Object> jobMap : jobs) {
                        fetched.add(Job.builder()
                                .jobTitle((String) jobMap.get("title"))
                                .companyName((String) jobMap.get("company"))
                                .location((String) jobMap.get("location"))
                                .salary("Not Disclosed")
                                .experience("2 - 5 years")
                                .jobType("Full Time")
                                .workMode("Onsite")
                                .jobSource("Jooble")
                                .jobUrl((String) jobMap.get("link"))
                                .description((String) jobMap.get("snippet"))
                                .skillsRequired("Java, Spring Boot, Microservices")
                                .postedDate(LocalDate.now())
                                .createdAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Jooble API call failed: {}. Triggering mock fallback...", e.getMessage());
            return getJoobleMockData();
        }

        return fetched;
    }

    public List<Job> removeDuplicateJobs(List<Job> jobs) {
        List<Job> uniqueJobs = new ArrayList<>();
        for (Job job : jobs) {
            boolean dbDuplicate = jobRepository.existsByCompanyNameAndJobTitleAndLocationAndPostedDate(
                    job.getCompanyName(), job.getJobTitle(), job.getLocation(), job.getPostedDate());

            boolean batchDuplicate = uniqueJobs.stream().anyMatch(uj ->
                    uj.getCompanyName().equalsIgnoreCase(job.getCompanyName()) &&
                    uj.getJobTitle().equalsIgnoreCase(job.getJobTitle()) &&
                    uj.getLocation().equalsIgnoreCase(job.getLocation()) &&
                    uj.getPostedDate().equals(job.getPostedDate())
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

    private List<Job> getJSearchMockData() {
        log.warn("Mock fallback responses disabled.");
        return new ArrayList<>();
    }

    private List<Job> getAdzunaMockData() {
        log.warn("Mock fallback responses disabled.");
        return new ArrayList<>();
    }

    private List<Job> getJoobleMockData() {
        log.warn("Mock fallback responses disabled.");
        return new ArrayList<>();
    }
}

