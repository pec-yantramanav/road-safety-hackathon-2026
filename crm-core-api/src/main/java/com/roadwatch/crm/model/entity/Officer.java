package com.roadwatch.crm.model.entity;

import com.roadwatch.crm.model.enums.*;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "officers")
public class Officer {
    @Id
    private UUID id; // Keycloak sub ID

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfficerRole role;

    private UUID jurisdictionId;

    @Enumerated(EnumType.STRING)
    private AuthorityType authorityType;

    private boolean isActive = true;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public OfficerRole getRole() { return role; }
    public void setRole(OfficerRole role) { this.role = role; }

    public UUID getJurisdictionId() { return jurisdictionId; }
    public void setJurisdictionId(UUID jurisdictionId) { this.jurisdictionId = jurisdictionId; }

    public AuthorityType getAuthorityType() { return authorityType; }
    public void setAuthorityType(AuthorityType authorityType) { this.authorityType = authorityType; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
