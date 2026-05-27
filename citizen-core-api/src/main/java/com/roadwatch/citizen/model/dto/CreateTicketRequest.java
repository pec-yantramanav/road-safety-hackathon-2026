package com.roadwatch.citizen.model.dto;

import com.roadwatch.citizen.model.enums.TicketCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class CreateTicketRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private TicketCategory category;

    @NotNull
    private Double lat;

    @NotNull
    private Double lng;

    private List<String> photoUrls;

    private boolean isAnonymous;

    private UUID citizenId;

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TicketCategory getCategory() { return category; }
    public void setCategory(TicketCategory category) { this.category = category; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public List<String> getPhotoUrls() { return photoUrls; }
    public void setPhotoUrls(List<String> photoUrls) { this.photoUrls = photoUrls; }

    public boolean isAnonymous() { return isAnonymous; }
    public void setAnonymous(boolean anonymous) { isAnonymous = anonymous; }

    public UUID getCitizenId() { return citizenId; }
    public void setCitizenId(UUID citizenId) { this.citizenId = citizenId; }
}
