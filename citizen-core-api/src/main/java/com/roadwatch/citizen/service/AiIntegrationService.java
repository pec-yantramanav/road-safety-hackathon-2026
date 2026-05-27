package com.roadwatch.citizen.service;

import com.roadwatch.citizen.model.enums.AuthorityType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;
import java.util.UUID;

@Service
public class AiIntegrationService {

    @Autowired
    private WebClient aiWebClient;

    public Mono<GeoResolveResponse> resolveGeo(double lat, double lng) {
        return aiWebClient.post()
                .uri("/geo/resolve")
                .bodyValue(Map.of("lat", lat, "lng", lng))
                .retrieve()
                .bodyToMono(GeoResolveResponse.class)
                .onErrorReturn(getDefaultGeoResolveResponse(lat, lng));
    }

    public Mono<FilterResponse> filterComplaint(double lat, double lng, String category, String description, UUID citizenId) {
        return aiWebClient.post()
                .uri("/ai/filter/complaint")
                .bodyValue(Map.of(
                        "lat", lat,
                        "lng", lng,
                        "category", category,
                        "description", description == null ? "" : description,
                        "citizen_id", citizenId == null ? "" : citizenId.toString()
                ))
                .retrieve()
                .bodyToMono(FilterResponse.class)
                .onErrorReturn(new FilterResponse("PASS", 1.0));
    }

    private GeoResolveResponse getDefaultGeoResolveResponse(double lat, double lng) {
        GeoResolveResponse response = new GeoResolveResponse();
        // Default to Ward 42 seed ID
        response.setJurisdictionId(UUID.fromString("447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1"));
        response.setAuthorityType(AuthorityType.MUNICIPAL);
        response.setBlackspot(false);
        return response;
    }

    public static class GeoResolveResponse {
        private UUID jurisdictionId;
        private AuthorityType authorityType;
        private boolean isBlackspot;

        public UUID getJurisdictionId() { return jurisdictionId; }
        public void setJurisdictionId(UUID jurisdictionId) { this.jurisdictionId = jurisdictionId; }

        public AuthorityType getAuthorityType() { return authorityType; }
        public void setAuthorityType(AuthorityType authorityType) { this.authorityType = authorityType; }

        public boolean isBlackspot() { return isBlackspot; }
        public void setBlackspot(boolean blackspot) { isBlackspot = blackspot; }
    }

    public static class FilterResponse {
        private String verdict;
        private double confidence;

        public FilterResponse() {}
        public FilterResponse(String verdict, double confidence) {
            this.verdict = verdict;
            this.confidence = confidence;
        }

        public String getVerdict() { return verdict; }
        public void setVerdict(String verdict) { this.verdict = verdict; }

        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }
}
