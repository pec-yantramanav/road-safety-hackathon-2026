package com.roadwatch.citizen.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ticket_contributions")
public class TicketContribution {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private UUID masterTicketId;

    private UUID citizenId;

    private String description;

    @Column(columnDefinition = "text[]")
    private List<String> photoUrls;

    private double lat;
    private double lng;

    private LocalDateTime submittedAt = LocalDateTime.now();

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getMasterTicketId() { return masterTicketId; }
    public void setMasterTicketId(UUID masterTicketId) { this.masterTicketId = masterTicketId; }

    public UUID getCitizenId() { return citizenId; }
    public void setCitizenId(UUID citizenId) { this.citizenId = citizenId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getPhotoUrls() { return photoUrls; }
    public void setPhotoUrls(List<String> photoUrls) { this.photoUrls = photoUrls; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
