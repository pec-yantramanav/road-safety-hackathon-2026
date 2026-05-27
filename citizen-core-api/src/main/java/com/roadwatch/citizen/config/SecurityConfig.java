package com.roadwatch.citizen.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/api/v1/citizen/tickets/nearby").permitAll()
                .requestMatchers("/api/v1/citizen/tickets/clusters").permitAll()
                .requestMatchers("/api/v1/citizen/tickets/*/events").permitAll()
                .anyRequest().permitAll() // Permit all to support anonymous reporting & hackathon client requests
            )
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
