package com.roadwatch.citizen.model.dto;

import jakarta.validation.constraints.NotBlank;

public class SignupRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String phone;

    private String email;
    private String aadharNumber;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAadharNumber() { return aadharNumber; }
    public void setAadharNumber(String aadharNumber) { this.aadharNumber = aadharNumber; }
}
