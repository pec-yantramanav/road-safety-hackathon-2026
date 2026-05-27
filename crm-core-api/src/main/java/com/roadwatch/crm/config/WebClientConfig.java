package com.roadwatch.crm.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${roadwatch.ai-service-url}")
    private String aiServiceUrl;

    @Bean
    public WebClient aiWebClient() {
        return WebClient.builder()
                .baseUrl(aiServiceUrl)
                .build();
    }
}
