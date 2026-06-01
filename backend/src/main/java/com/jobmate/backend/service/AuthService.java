package com.jobmate.backend.service;

import com.jobmate.backend.dto.AuthResponse;
import com.jobmate.backend.dto.LoginRequest;
import com.jobmate.backend.dto.RegisterRequest;
import com.jobmate.backend.dto.UserDto;
import com.jobmate.backend.entity.User;
import com.jobmate.backend.exception.InvalidCredentialsException;
import com.jobmate.backend.exception.ResourceAlreadyExistsException;
import com.jobmate.backend.exception.ResourceNotFoundException;
import com.jobmate.backend.repository.UserRepository;
import com.jobmate.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Password and Confirm Password do not match.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("An account with that email already exists.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("CANDIDATE")
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password."));

        if (!user.getIsActive()) {
            throw new InvalidCredentialsException("This user account is inactive.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public AuthResponse forgotPassword(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        // Generate a temporary reset token (in production, store this in DB with expiration)
        String resetToken = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(resetToken)
                .build();
    }

    public AuthResponse resetPassword(String token, String newPassword) {
        if (!jwtUtil.isTokenValid(token)) {
            throw new InvalidCredentialsException("The password reset token is invalid or has expired.");
        }

        String email = jwtUtil.extractEmail(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return AuthResponse.builder()
                .build();
    }
}
