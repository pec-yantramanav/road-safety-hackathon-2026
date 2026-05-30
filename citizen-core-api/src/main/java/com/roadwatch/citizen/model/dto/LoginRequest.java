package com.roadwatch.citizen.model.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    @NotBlank
    private String phone;

    // Getters and Setters
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
