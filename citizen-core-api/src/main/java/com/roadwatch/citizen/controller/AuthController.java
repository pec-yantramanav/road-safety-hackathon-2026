package com.roadwatch.citizen.controller;

import com.roadwatch.citizen.model.dto.SignupRequest;
import com.roadwatch.citizen.model.dto.LoginRequest;
import com.roadwatch.citizen.model.dto.AuthResponse;
import com.roadwatch.citizen.model.entity.User;
import com.roadwatch.citizen.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/citizen/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {
        if (req.getPhone() == null || req.getPhone().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Phone number is required");
        }

        Optional<User> existingUser = userRepository.findByPhone(req.getPhone());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("User with this phone number already exists. Please log in.");
        }

        User newUser = new User();
        newUser.setId(UUID.randomUUID());
        newUser.setName(req.getName());
        newUser.setPhone(req.getPhone());
        newUser.setEmail(req.getEmail());
        newUser.setAadharNumber(req.getAadharNumber());
        newUser.setRole("CITIZEN");
        
        User savedUser = userRepository.save(newUser);

        AuthResponse.UserDetails userDetails = new AuthResponse.UserDetails(
            savedUser.getId(),
            savedUser.getPhone(),
            savedUser.getName()
        );

        AuthResponse res = new AuthResponse(
            "simulated-access-jwt-token",
            "simulated-refresh-jwt-token",
            userDetails
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        if (req.getPhone() == null || req.getPhone().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Phone number is required");
        }

        Optional<User> userOpt = userRepository.findByPhone(req.getPhone());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User profile not found. Please sign up first.");
        }

        User user = userOpt.get();

        AuthResponse.UserDetails userDetails = new AuthResponse.UserDetails(
            user.getId(),
            user.getPhone(),
            user.getName()
        );

        AuthResponse res = new AuthResponse(
            "simulated-access-jwt-token",
            "simulated-refresh-jwt-token",
            userDetails
        );

        return ResponseEntity.ok(res);
    }
}
