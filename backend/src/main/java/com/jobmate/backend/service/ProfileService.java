package com.jobmate.backend.service;

import com.jobmate.backend.dto.ProfileRequest;
import com.jobmate.backend.dto.ProfileResponse;
import com.jobmate.backend.entity.Profile;
import com.jobmate.backend.entity.User;
import com.jobmate.backend.exception.ResourceNotFoundException;
import com.jobmate.backend.repository.ProfileRepository;
import com.jobmate.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    private static final Pattern URL_PATTERN = Pattern.compile("^(https?://)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(/.*)?$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9\\s\\-()]{8,20}$");

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Profile profile = profileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    // Build a fresh default profile shell synced with registration info
                    Profile newProfile = Profile.builder()
                            .user(user)
                            .fullName(user.getFullName())
                            .email(user.getEmail())
                            .phone(user.getPhone())
                            .build();
                    newProfile.setProfileCompletion(calculateProfileCompletion(newProfile));
                    return newProfile;
                });

        return mapToResponse(profile);
    }

    @Transactional
    public ProfileResponse createProfile(ProfileRequest request, String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (profileRepository.existsByUserId(user.getId())) {
            throw new IllegalArgumentException("Profile already exists for this user. Use update (PUT) instead.");
        }

        validateProfileRequest(request);

        // Sync changes back to the User entity
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        userRepository.save(user);

        Profile profile = Profile.builder()
                .user(user)
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .location(request.getLocation())
                .degree(request.getDegree())
                .specialization(request.getSpecialization())
                .collegeName(request.getCollegeName())
                .graduationYear(request.getGraduationYear())
                .cgpa(request.getCgpa())
                .preferredRole(request.getPreferredRole())
                .preferredLocation(request.getPreferredLocation())
                .experienceLevel(request.getExperienceLevel())
                .linkedinUrl(request.getLinkedinUrl())
                .githubUrl(request.getGithubUrl())
                .portfolioUrl(request.getPortfolioUrl())
                .profilePhoto(request.getProfilePhoto())
                .profilePhotoPosition(request.getProfilePhotoPosition())
                .skills(request.getSkills())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        profile.setProfileCompletion(calculateProfileCompletion(profile));
        Profile savedProfile = profileRepository.save(profile);
        log.info("Successfully created profile for user: {} with completion: {}%", email, savedProfile.getProfileCompletion());

        return mapToResponse(savedProfile);
    }

    @Transactional
    public ProfileResponse updateProfile(ProfileRequest request, String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Profile profile = profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user: " + email));

        validateProfileRequest(request);

        // Sync changes back to User
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        userRepository.save(user);

        // Update profile fields
        profile.setFullName(request.getFullName());
        profile.setEmail(request.getEmail().toLowerCase());
        profile.setPhone(request.getPhone());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setGender(request.getGender());
        profile.setLocation(request.getLocation());
        profile.setDegree(request.getDegree());
        profile.setSpecialization(request.getSpecialization());
        profile.setCollegeName(request.getCollegeName());
        profile.setGraduationYear(request.getGraduationYear());
        profile.setCgpa(request.getCgpa());
        profile.setPreferredRole(request.getPreferredRole());
        profile.setPreferredLocation(request.getPreferredLocation());
        profile.setExperienceLevel(request.getExperienceLevel());
        profile.setLinkedinUrl(request.getLinkedinUrl());
        profile.setGithubUrl(request.getGithubUrl());
        profile.setPortfolioUrl(request.getPortfolioUrl());
        profile.setProfilePhoto(request.getProfilePhoto());
        profile.setProfilePhotoPosition(request.getProfilePhotoPosition());
        profile.setSkills(request.getSkills());
        profile.setUpdatedAt(LocalDateTime.now());

        profile.setProfileCompletion(calculateProfileCompletion(profile));
        Profile savedProfile = profileRepository.save(profile);
        log.info("Successfully updated profile for user: {} with completion: {}%", email, savedProfile.getProfileCompletion());

        return mapToResponse(savedProfile);
    }

    public int calculateProfileCompletion(Profile profile) {
        if (profile == null) return 0;

        // 1. Personal Info = 30% Max (6 fields, each present = 5.0%)
        double personalScore = 0.0;
        Object[] personalFields = {
                profile.getFullName(),
                profile.getEmail(),
                profile.getPhone(),
                profile.getDateOfBirth(),
                profile.getGender(),
                profile.getLocation()
        };
        for (Object field : personalFields) {
            if (field != null && !field.toString().trim().isEmpty()) {
                personalScore += 5.0;
            }
        }

        // 2. Education = 25% Max (5 fields, each present = 5.0%)
        double educationScore = 0.0;
        Object[] educationFields = {
                profile.getDegree(),
                profile.getSpecialization(),
                profile.getCollegeName(),
                profile.getGraduationYear(),
                profile.getCgpa()
        };
        for (Object field : educationFields) {
            if (field != null && !field.toString().trim().isEmpty()) {
                educationScore += 5.0;
            }
        }

        // 3. Skills = 25% Max (1 field, present = 25.0%)
        double skillsScore = 0.0;
        if (profile.getSkills() != null && !profile.getSkills().trim().isEmpty()) {
            skillsScore = 25.0;
        }

        // 4. Links = 20% Max (3 fields, each present = 20.0 / 3.0)
        double linksScore = 0.0;
        Object[] linksFields = {
                profile.getLinkedinUrl(),
                profile.getGithubUrl(),
                profile.getPortfolioUrl()
        };
        for (Object field : linksFields) {
            if (field != null && !field.toString().trim().isEmpty()) {
                linksScore += (20.0 / 3.0);
            }
        }

        double total = personalScore + educationScore + skillsScore + linksScore;
        return (int) Math.round(total);
    }

    private void validateProfileRequest(ProfileRequest request) {
        // Required fields checks
        if (isEmpty(request.getFullName())) {
            throw new IllegalArgumentException("Full name is required.");
        }
        if (isEmpty(request.getEmail())) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (isEmpty(request.getPhone())) {
            throw new IllegalArgumentException("Phone number is required.");
        }
        if (isEmpty(request.getPreferredRole())) {
            throw new IllegalArgumentException("Preferred role is required.");
        }
        if (isEmpty(request.getPreferredLocation())) {
            throw new IllegalArgumentException("Preferred location is required.");
        }

        // Phone number validation check
        if (!PHONE_PATTERN.matcher(request.getPhone()).matches()) {
            throw new IllegalArgumentException("Invalid phone number format. Enter a valid 8-20 digit number.");
        }

        // Graduation Year validation
        if (request.getGraduationYear() != null) {
            int currentYear = LocalDate.now().getYear();
            if (request.getGraduationYear() < 1900 || request.getGraduationYear() > currentYear + 10) {
                throw new IllegalArgumentException("Invalid graduation year. Must be between 1900 and " + (currentYear + 10) + ".");
            }
        }

        // CGPA validation
        if (request.getCgpa() != null) {
            if (request.getCgpa() < 0.0 || request.getCgpa() > 10.0) {
                throw new IllegalArgumentException("Invalid CGPA. Must be between 0.0 and 10.0.");
            }
        }

        // URL validations
        validateUrl(request.getLinkedinUrl(), "LinkedIn URL");
        validateUrl(request.getGithubUrl(), "GitHub URL");
        validateUrl(request.getPortfolioUrl(), "Portfolio URL");
    }

    private void validateUrl(String url, String fieldName) {
        if (url != null && !url.trim().isEmpty()) {
            if (!URL_PATTERN.matcher(url.trim()).matches()) {
                throw new IllegalArgumentException("Invalid format for " + fieldName + ".");
            }
        }
    }

    private boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    private ProfileResponse mapToResponse(Profile profile) {
        if (profile == null) return null;
        return ProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .fullName(profile.getFullName())
                .email(profile.getEmail())
                .phone(profile.getPhone())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .location(profile.getLocation())
                .degree(profile.getDegree())
                .specialization(profile.getSpecialization())
                .collegeName(profile.getCollegeName())
                .graduationYear(profile.getGraduationYear())
                .cgpa(profile.getCgpa())
                .preferredRole(profile.getPreferredRole())
                .preferredLocation(profile.getPreferredLocation())
                .experienceLevel(profile.getExperienceLevel())
                .linkedinUrl(profile.getLinkedinUrl())
                .githubUrl(profile.getGithubUrl())
                .portfolioUrl(profile.getPortfolioUrl())
                .profilePhoto(profile.getProfilePhoto())
                .profilePhotoPosition(profile.getProfilePhotoPosition())
                .skills(profile.getSkills())
                .profileCompletion(profile.getProfileCompletion())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
