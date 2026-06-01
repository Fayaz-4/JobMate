package com.jobmate.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponse {
    private Long id;
    private String fileName;
    private String originalFileName;
    private String uploadStatus;
    private String message;
    private LocalDateTime uploadedAt;
}
