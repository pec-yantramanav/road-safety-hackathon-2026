package com.roadwatch.crm.model.entity;

import com.roadwatch.crm.model.enums.AuthorityType;
import jakarta.persistence.*;
import org.locationtech.jts.geom.MultiPolygon;
import java.util.UUID;

@Entity
@Table(name = "jurisdictions")
public class Jurisdiction {
    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String level; // WARD, DIVISION, CIRCLE, DISTRICT, STATE, NATIONAL

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthorityType authorityType;

    @Column(columnDefinition = "geometry(MultiPolygon,4326)")
    private MultiPolygon geometry;

    private UUID parentId;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public AuthorityType getAuthorityType() { return authorityType; }
    public void setAuthorityType(AuthorityType authorityType) { this.authorityType = authorityType; }

    public MultiPolygon getGeometry() { return geometry; }
    public void setGeometry(MultiPolygon geometry) { this.geometry = geometry; }

    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }
}
