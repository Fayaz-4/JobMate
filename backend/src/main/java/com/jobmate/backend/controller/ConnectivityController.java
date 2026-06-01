package com.jobmate.backend.controller;

import com.jobmate.backend.service.ConnectivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import java.util.Map;

@RestController
@RequestMapping("/connectivity-status")
@RequiredArgsConstructor
public class ConnectivityController {

    private final ConnectivityService connectivityService;


    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(connectivityService.getStatusMap());
    }
}
