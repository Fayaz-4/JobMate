package com.jobmate.backend.controller;

import com.jobmate.backend.service.RealTimeInterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/realtime-interview")
@RequiredArgsConstructor
public class RealTimeInterviewController {

    private final RealTimeInterviewService realTimeInterviewService;

    @PostMapping("/start/{applicationId}")
    public ResponseEntity<Map<String, Object>> startSession(
            Principal principal,
            @PathVariable Long applicationId,
            @RequestParam(defaultValue = "Mixed") String type) {
        Map<String, Object> sessionPayload = realTimeInterviewService.startSession(
                principal.getName(), applicationId, type);
        return ResponseEntity.ok(sessionPayload);
    }

    @PostMapping("/start-resume-mock")
    public ResponseEntity<Map<String, Object>> startResumeMock(
            Principal principal,
            @RequestParam(defaultValue = "Mixed") String type) {
        Map<String, Object> sessionPayload = realTimeInterviewService.startResumeMockSession(
                principal.getName(), type);
        return ResponseEntity.ok(sessionPayload);
    }

    @PostMapping("/submit-answer/{sessionId}")
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> request) {
        String question = request.get("question");
        String userAnswer = request.get("userAnswer");
        Map<String, Object> evaluationResult = realTimeInterviewService.submitAnswer(
                sessionId, question, userAnswer);
        return ResponseEntity.ok(evaluationResult);
    }

    @PostMapping("/end/{sessionId}")
    public ResponseEntity<Map<String, Object>> endSession(
            @PathVariable Long sessionId,
            @RequestParam(required = false) String vapiCallId) {
        Map<String, Object> finalReport = realTimeInterviewService.endSession(sessionId, vapiCallId);
        return ResponseEntity.ok(finalReport);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(Principal principal) {
        List<Map<String, Object>> history = realTimeInterviewService.getHistory(principal.getName());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/report/{sessionId}")
    public ResponseEntity<Map<String, Object>> getReport(@PathVariable Long sessionId) {
        Map<String, Object> report = realTimeInterviewService.getSessionReport(sessionId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats(Principal principal) {
        Map<String, Object> stats = realTimeInterviewService.getDashboardStats(principal.getName());
        return ResponseEntity.ok(stats);
    }
}
