package com.roadwatch.crm.service;

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

    public Mono<SlaPredictionResponse> predictSlaBreach(UUID ticketId, UUID officerId, String status, String category, String priority) {
        return aiWebClient.post()
                .uri("/ai/sla/predict")
                .bodyValue(Map.of(
                        "ticket_id", ticketId.toString(),
                        "assigned_officer_id", officerId == null ? "" : officerId.toString(),
                        "current_status", status,
                        "category", category,
                        "priority", priority
                ))
                .retrieve()
                .bodyToMono(SlaPredictionResponse.class)
                .onErrorReturn(new SlaPredictionResponse(false, "ON_TRACK", "SLA is on track."));
    }

    public Mono<PoWValidationResponse> validateWorkOrder(UUID workOrderId, double lat, double lng, String beforePhoto, String afterPhoto) {
        return aiWebClient.post()
                .uri("/ai/validate/workorder")
                .bodyValue(Map.of(
                        "workorder_id", workOrderId.toString(),
                        "ticket_lat", lat,
                        "ticket_lng", lng,
                        "before_photo_url", beforePhoto == null ? "" : beforePhoto,
                        "after_photo_url", afterPhoto == null ? "" : afterPhoto
                ))
                .retrieve()
                .bodyToMono(PoWValidationResponse.class)
                .onErrorReturn(new PoWValidationResponse("APPROVED", true, true, 1.0));
    }

    public Mono<UcResponse> generateUc(UUID workOrderId, UUID officerId) {
        return aiWebClient.post()
                .uri("/ai/generate/uc")
                .bodyValue(Map.of(
                        "workorder_id", workOrderId.toString(),
                        "officer_id", officerId.toString()
                ))
                .retrieve()
                .bodyToMono(UcResponse.class)
                .onErrorReturn(new UcResponse("http://mock-uc-s3-bucket.s3.amazonaws.com/uc-" + workOrderId + ".pdf", "Mock UC generated for WO " + workOrderId));
    }

    public static class SlaPredictionResponse {
        private boolean breachLikely;
        private String recommendedAction;
        private String reason;

        public SlaPredictionResponse() {}
        public SlaPredictionResponse(boolean breachLikely, String recommendedAction, String reason) {
            this.breachLikely = breachLikely;
            this.recommendedAction = recommendedAction;
            this.reason = reason;
        }

        public boolean isBreachLikely() { return breachLikely; }
        public void setBreachLikely(boolean breachLikely) { this.breachLikely = breachLikely; }

        public String getRecommendedAction() { return recommendedAction; }
        public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class PoWValidationResponse {
        private String verdict;
        private boolean locationMatch;
        private boolean visualChangeDetected;
        private double confidence;

        public PoWValidationResponse() {}
        public PoWValidationResponse(String verdict, boolean locationMatch, boolean visualChangeDetected, double confidence) {
            this.verdict = verdict;
            this.locationMatch = locationMatch;
            this.visualChangeDetected = visualChangeDetected;
            this.confidence = confidence;
        }

        public String getVerdict() { return verdict; }
        public void setVerdict(String verdict) { this.verdict = verdict; }

        public boolean isLocationMatch() { return locationMatch; }
        public void setLocationMatch(boolean locationMatch) { this.locationMatch = locationMatch; }

        public boolean isVisualChangeDetected() { return visualChangeDetected; }
        public void setVisualChangeDetected(boolean visualChangeDetected) { this.visualChangeDetected = visualChangeDetected; }

        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
    }

    public static class UcResponse {
        private String documentUrl;
        private String summary;

        public UcResponse() {}
        public UcResponse(String documentUrl, String summary) {
            this.documentUrl = documentUrl;
            this.summary = summary;
        }

        public String getDocumentUrl() { return documentUrl; }
        public void setDocumentUrl(String documentUrl) { this.documentUrl = documentUrl; }

        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
    }
}
