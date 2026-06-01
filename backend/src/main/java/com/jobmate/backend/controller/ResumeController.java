package com.jobmate.backend.controller;

import com.jobmate.backend.dto.ResumeResponse;
import com.jobmate.backend.dto.UploadResponse;
import com.jobmate.backend.dto.SkillResponse;
import com.jobmate.backend.entity.Resume;
import com.jobmate.backend.service.ResumeService;
import com.jobmate.backend.service.SkillExtractionService;
import com.jobmate.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;

@RestController
@RequestMapping("/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final SkillExtractionService skillExtractionService;

    @GetMapping
    public ResponseEntity<ResumeResponse> getResume(Principal principal) {
        ResumeResponse response = resumeService.getResume(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadResume(@RequestParam("file") MultipartFile file, Principal principal) throws IOException {
        UploadResponse response = resumeService.uploadResume(file, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/replace/{id}")
    public ResponseEntity<UploadResponse> replaceResume(@PathVariable Long id, @RequestParam("file") MultipartFile file, Principal principal) throws IOException {
        UploadResponse response = resumeService.replaceResume(id, file, principal.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(@PathVariable Long id, Principal principal) {
        resumeService.deleteResume(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long id, Principal principal) throws IOException {
        Resume resume = resumeService.getResumeEntityById(id, principal.getName());
        Path path = Paths.get(resume.getFilePath());
        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new RuntimeException("Could not read file from disk: " + resume.getOriginalFileName());
        }

        String contentType = resume.getFileType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resume.getOriginalFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/skills")
    public ResponseEntity<SkillResponse> getExtractedSkills(Principal principal) {
        SkillResponse response = skillExtractionService.getExtractedSkills(principal.getName());
        return ResponseEntity.ok(response);
    }
}
