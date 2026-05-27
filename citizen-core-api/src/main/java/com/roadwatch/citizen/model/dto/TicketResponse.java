package com.roadwatch.citizen.model.dto;

import com.roadwatch.citizen.model.enums.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class TicketResponse {
    private UUID id;
    private String title;
    private String description;
    private TicketStatus status;
    private TicketPriority priority;
    private TicketCategory category;
    private Double lat;
    private Double lng;
    private int clusterRadiusM;
    private List<String> photoUrls;
    private boolean isAnonymous;
    private int contributorCount;
    private UUID citizenId;
    private UUID assignedTo;
    private UUID jurisdictionId;
    private AuthorityType authorityType;
    private LocalDateTime slaDeadline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }

    public TicketPriority getPriority() { return priority; }
    public void setPriority(TicketPriority priority) { this.priority = priority; }

    public TicketCategory getCategory() { return category; }
    public void setCategory(TicketCategory category) { this.category = category; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public int getClusterRadiusM() { return clusterRadiusM; }
    public void setClusterRadiusM(int clusterRadiusM) { this.clusterRadiusM = clusterRadiusM; }

    public List<String> getPhotoUrls() { return photoUrls; }
    public void setPhotoUrls(List<String> photoUrls) { this.photoUrls = photoUrls; }

    public boolean isAnonymous() { return isAnonymous; }
    public void setAnonymous(boolean anonymous) { isAnonymous = anonymous; }

    public int getContributorCount() { return contributorCount; }
    public void setContributorCount(int contributorCount) { this.contributorCount = contributorCount; }

    public UUID getCitizenId() { return citizenId; }
    public void setCitizenId(UUID citizenId) { this.citizenId = citizenId; }

    public UUID getAssignedTo() { return assignedTo; }
    public void setAssignedTo(UUID assignedTo) { this.assignedTo = assignedTo; }

    public UUID getJurisdictionId() { return jurisdictionId; }
    public void setJurisdictionId(UUID jurisdictionId) { this.jurisdictionId = jurisdictionId; }

    public AuthorityType getAuthorityType() { return authorityType; }
    public void setAuthorityType(AuthorityType authorityType) { this.authorityType = authorityType; }

    public LocalDateTime getSlaDeadline() { return slaDeadline; }
    public void setSlaDeadline(LocalDateTime slaDeadline) { this.slaDeadline = slaDeadline; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
