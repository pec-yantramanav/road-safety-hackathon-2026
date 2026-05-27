package com.roadwatch.crm.model.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "contractors")
public class Contractor {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "firm_name", nullable = false)
    private String firmName;

    @Column(name = "contact_person")
    private String contactPerson;

    private String phone;

    @Column(name = "is_active")
    private boolean isActive = true;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFirmName() { return firmName; }
    public void setFirmName(String firmName) { this.firmName = firmName; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
