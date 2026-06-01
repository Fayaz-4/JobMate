package com.jobmate.backend.service;

import com.jobmate.backend.dto.ResumeResponse;
import com.jobmate.backend.dto.UploadResponse;
import com.jobmate.backend.entity.Resume;
import com.jobmate.backend.entity.User;
import com.jobmate.backend.entity.ExtractedProfile;
import com.jobmate.backend.exception.ResourceNotFoundException;
import com.jobmate.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    
    // Additional Repositories for Cascading Deletions
    private final ExtractedProfileRepository extractedProfileRepository;
    private final ExtractedSkillRepository extractedSkillRepository;
    private final ExtractedEducationRepository extractedEducationRepository;
    private final ExtractedProjectRepository extractedProjectRepository;
    private final ExtractedExperienceRepository extractedExperienceRepository;

    // File Storage directory
    private static final String UPLOAD_DIR = "uploads/resumes";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("pdf", "doc", "docx");

    @Transactional(readOnly = true)
    public ResumeResponse getResume(String email) {
        Resume resume = resumeRepository.findByUserEmailIgnoreCase(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found for user: " + email));
        return mapToResponse(resume);
    }

    @Transactional(readOnly = true)
    public Resume getResumeEntityById(Long id, String email) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with ID: " + id));

        if (!resume.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("You are not authorized to access this resume.");
        }
        return resume;
    }

    @Transactional
    public UploadResponse uploadResume(MultipartFile file, String email) throws IOException {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        validateFile(file);

        // Maintain upload history: find any currently ACTIVE resume and mark it ARCHIVED
        Optional<Resume> activeResumeOpt = resumeRepository.findByUserId(user.getId());
        if (activeResumeOpt.isPresent()) {
            Resume activeResume = activeResumeOpt.get();
            activeResume.setUploadStatus("ARCHIVED");
            activeResume.setUpdatedAt(LocalDateTime.now());
            resumeRepository.save(activeResume);
            log.info("Archived existing active resume ID: {} for user: {}", activeResume.getId(), email);
        }

        // Ensure directories exist
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique file name to prevent overwrite
        String originalFileName = file.getOriginalFilename();
        String extension = getFileExtension(originalFileName);
        String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName;
        Path targetPath = uploadPath.resolve(uniqueFileName);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        Resume resume = Resume.builder()
                .user(user)
                .fileName(uniqueFileName)
                .originalFileName(originalFileName)
                .filePath(targetPath.toAbsolutePath().toString())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .uploadStatus("ACTIVE")
                .uploadedAt(LocalDateTime.now())
                .build();

        Resume savedResume = resumeRepository.save(resume);
        log.info("Successfully uploaded active resume ID: {} for user: {}", savedResume.getId(), email);

        return UploadResponse.builder()
                .id(savedResume.getId())
                .fileName(savedResume.getFileName())
                .originalFileName(savedResume.getOriginalFileName())
                .uploadStatus(savedResume.getUploadStatus())
                .message("Resume uploaded successfully")
                .uploadedAt(savedResume.getUploadedAt())
                .build();
    }

    @Transactional
    public UploadResponse replaceResume(Long id, MultipartFile file, String email) throws IOException {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with ID: " + id));

        if (!resume.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to replace this resume.");
        }

        validateFile(file);

        // Delete old file from physical storage
        try {
            Path oldPath = Paths.get(resume.getFilePath());
            Files.deleteIfExists(oldPath);
        } catch (Exception e) {
            log.error("Failed to delete physical file: " + resume.getFilePath(), e);
        }

        // Write new file to physical storage
        Path uploadPath = Paths.get(UPLOAD_DIR);
        String originalFileName = file.getOriginalFilename();
        String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName;
        Path targetPath = uploadPath.resolve(uniqueFileName);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Update database record
        resume.setFileName(uniqueFileName);
        resume.setOriginalFileName(originalFileName);
        resume.setFilePath(targetPath.toAbsolutePath().toString());
        resume.setFileType(file.getContentType());
        resume.setFileSize(file.getSize());
        resume.setUpdatedAt(LocalDateTime.now());

        Resume savedResume = resumeRepository.save(resume);
        log.info("Successfully replaced resume ID: {} for user: {}", savedResume.getId(), email);

        return UploadResponse.builder()
                .id(savedResume.getId())
                .fileName(savedResume.getFileName())
                .originalFileName(savedResume.getOriginalFileName())
                .uploadStatus(savedResume.getUploadStatus())
                .message("Resume replaced successfully")
                .uploadedAt(savedResume.getUploadedAt())
                .build();
    }

    @Transactional
    public void deleteResume(Long id, String email) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with ID: " + id));

        if (!resume.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new IllegalArgumentException("You are not authorized to delete this resume.");
        }

        log.info("ATS Delete: Cleaning up relational and history data for resume ID: {}", id);

        // 1. Unlink resume from ExtractedProfile
        Optional<ExtractedProfile> profileOpt = extractedProfileRepository.findByResumeId(id);
        if (profileOpt.isPresent()) {
            ExtractedProfile profile = profileOpt.get();
            profile.setResume(null);
            extractedProfileRepository.save(profile);
            log.info("ATS Delete: Unlinked resume ID: {} from ExtractedProfile ID: {}", id, profile.getId());
        }



        // 3. Delete extracted relational items
        extractedSkillRepository.deleteByResumeId(id);
        extractedEducationRepository.deleteByResumeId(id);
        extractedProjectRepository.deleteByResumeId(id);
        extractedExperienceRepository.deleteByResumeId(id);
        log.info("ATS Delete: Cleaned up relational skills, education, projects, and experiences for resume ID: {}", id);

        // Delete from physical storage
        try {
            Path filePath = Paths.get(resume.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (Exception e) {
            log.error("Failed to delete physical file: " + resume.getFilePath(), e);
        }

        // Delete from database
        resumeRepository.delete(resume);
        log.info("Successfully deleted resume ID: {} for user: {}", id, email);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No File Uploaded");
        }

        // Size limit check
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File Too Large");
        }

        // Content / Extension validation
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || !originalFileName.contains(".")) {
            throw new IllegalArgumentException("Invalid File Type");
        }

        String extension = getFileExtension(originalFileName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Invalid File Type");
        }
    }

    private String getFileExtension(String filename) {
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    private ResumeResponse mapToResponse(Resume resume) {
        if (resume == null) return null;
        return ResumeResponse.builder()
                .id(resume.getId())
                .userId(resume.getUser() != null ? resume.getUser().getId() : null)
                .fileName(resume.getFileName())
                .originalFileName(resume.getOriginalFileName())
                .fileType(resume.getFileType())
                .fileSize(resume.getFileSize())
                .uploadStatus(resume.getUploadStatus())
                .uploadedAt(resume.getUploadedAt())
                .updatedAt(resume.getUpdatedAt())
                .build();
    }
}
