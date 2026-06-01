package com.jobmate.backend.controller;

import com.jobmate.backend.dto.ApplicationRequest;
import com.jobmate.backend.dto.ApplicationResponse;
import com.jobmate.backend.dto.ApplicationStatusUpdateRequest;
import com.jobmate.backend.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/apply")
    public ResponseEntity<ApplicationResponse> applyJob(
            @Valid @RequestBody ApplicationRequest request,
            Principal principal
    ) {
        ApplicationResponse response = applicationService.applyJob(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> getApplications(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            Principal principal
    ) {
        List<ApplicationResponse> list = applicationService.getApplications(
                principal.getName(), status, company, role, startDate, endDate, search
        );
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponse> getApplication(
            @PathVariable Long id,
            Principal principal
    ) {
        ApplicationResponse response = applicationService.getApplication(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationStatusUpdateRequest request,
            Principal principal
    ) {
        ApplicationResponse response = applicationService.updateStatus(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/status")
    public ResponseEntity<ApplicationResponse> updateStatusDirect(
            @Valid @RequestBody ApplicationStatusUpdateRequest request,
            Principal principal
    ) {
        ApplicationResponse response = applicationService.updateStatus(request.getId(), request, principal.getName());
        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteApplication(
            @PathVariable Long id,
            Principal principal
    ) {
        applicationService.deleteApplication(id, principal.getName());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Application record with ID " + id + " has been successfully deleted"
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getApplicationStats(Principal principal) {
        Map<String, Long> stats = applicationService.getApplicationStats(principal.getName());
        return ResponseEntity.ok(stats);
    }
}
