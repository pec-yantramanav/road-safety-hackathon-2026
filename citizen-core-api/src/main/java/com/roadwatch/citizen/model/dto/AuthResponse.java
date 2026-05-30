package com.roadwatch.citizen.model.dto;

import java.util.UUID;

public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserDetails user;

    public AuthResponse(String accessToken, String refreshToken, UserDetails user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public UserDetails getUser() { return user; }
    public void setUser(UserDetails user) { this.user = user; }

    public static class UserDetails {
        private UUID id;
        private String phone;
        private String name;

        public UserDetails(UUID id, String phone, String name) {
            this.id = id;
            this.phone = phone;
            this.name = name;
        }

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
