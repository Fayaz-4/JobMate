package com.jobmate.backend.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConnectivityService {

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    @Value("${vapi.private.key:}")
    private String vapiPrivateKey;

    @Value("${jsearch.api.key:}")
    private String jsearchApiKey;

    @Value("${jsearch.base.url:https://api.openwebninja.com/jsearch}")
    private String jsearchBaseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, Object> cachedStatus = new java.util.concurrent.ConcurrentHashMap<>();

    @PostConstruct
    public void verifyAllConnectivity() {
        log.info("================ STARTUP SERVICE CONNECTIVITY CHECKS ================");
        
        // 1. Check OpenAI
        try {
            boolean ok = checkOpenAI();
            if (ok) {
                log.info("✓ OpenAI Connected");
                cachedStatus.put("openai", "Connected");
            } else {
                log.error("✗ OpenAI Connection failed: Invalid API key or request rejected");
                cachedStatus.put("openai", "Failed: Invalid API Key or rejected response");
            }
        } catch (Exception e) {
            log.error("✗ OpenAI Connection failed: {}", e.getMessage());
            cachedStatus.put("openai", "Failed: " + e.getMessage());
        }

        // 2. Check Vapi
        try {
            boolean ok = checkVapi();
            if (ok) {
                log.info("✓ Vapi Connected");
                cachedStatus.put("vapi", "Connected");
            } else {
                log.error("✗ Vapi Connection failed: Invalid API key or request rejected");
                cachedStatus.put("vapi", "Failed: Invalid Private Key or rejected response");
            }
        } catch (Exception e) {
            log.error("✗ Vapi Connection failed: {}", e.getMessage());
            cachedStatus.put("vapi", "Failed: " + e.getMessage());
        }

        // 3. Check JSearch
        try {
            boolean ok = checkJSearch();
            if (ok) {
                log.info("✓ JSearch Connected");
                cachedStatus.put("jsearch", "Connected");
            } else {
                log.error("✗ JSearch Connection failed: Invalid API key or request rejected");
                cachedStatus.put("jsearch", "Failed: Invalid API Key or rejected response");
            }
        } catch (Exception e) {
            log.error("✗ JSearch Connection failed: {}", e.getMessage());
            cachedStatus.put("jsearch", "Failed: " + e.getMessage());
        }
        log.info("=====================================================================");
    }

    public Map<String, Object> getStatusMap() {
        if (cachedStatus.isEmpty()) {
            verifyAllConnectivity();
        }
        return new HashMap<>(cachedStatus);
    }

    private boolean checkOpenAI() {
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
            throw new RuntimeException("OpenAI API key is missing");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + openaiApiKey.trim());
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange("https://api.openai.com/v1/models", HttpMethod.GET, entity, Map.class);
        return response.getStatusCode().is2xxSuccessful();
    }

    private boolean checkVapi() {
        if (vapiPrivateKey == null || vapiPrivateKey.trim().isEmpty()) {
            throw new RuntimeException("Vapi private key is missing");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + vapiPrivateKey.trim());
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<List> response = restTemplate.exchange("https://api.vapi.ai/call?limit=1", HttpMethod.GET, entity, List.class);
        return response.getStatusCode().is2xxSuccessful();
    }

    private boolean checkJSearch() {
        if (jsearchApiKey == null || jsearchApiKey.trim().isEmpty()) {
            throw new RuntimeException("JSearch API key is missing");
        }
        String baseUrl = jsearchBaseUrl != null && !jsearchBaseUrl.isEmpty() ? jsearchBaseUrl.trim() : "https://api.openwebninja.com/jsearch";
        String url = baseUrl + "/search?query=test&num_pages=1";
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", jsearchApiKey.trim());
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        return response.getStatusCode().is2xxSuccessful();
    }
}
