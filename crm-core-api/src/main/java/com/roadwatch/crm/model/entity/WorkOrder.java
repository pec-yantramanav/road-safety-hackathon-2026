package com.roadwatch.crm.model.entity;

import com.roadwatch.crm.model.enums.WorkOrderStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "work_orders")
public class WorkOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private UUID ticketId;

    @Column(nullable = false)
    private UUID contractorId;

    @Enumerated(EnumType.STRING)
    private WorkOrderStatus status = WorkOrderStatus.ASSIGNED;

    private String description;

    @Column(columnDefinition = "text[]")
    private List<String> proofPhotoUrls;

    private BigDecimal estimatedCost;
    private BigDecimal actualCost;

    private UUID assignedBy;
    private UUID approvedBy;

    private LocalDateTime assignedAt = LocalDateTime.now();
    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTicketId() { return ticketId; }
    public void setTicketId(UUID ticketId) { this.ticketId = ticketId; }

    public UUID getContractorId() { return contractorId; }
    public void setContractorId(UUID contractorId) { this.contractorId = contractorId; }

    public WorkOrderStatus getStatus() { return status; }
    public void setStatus(WorkOrderStatus status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getProofPhotoUrls() { return proofPhotoUrls; }
    public void setProofPhotoUrls(List<String> proofPhotoUrls) { this.proofPhotoUrls = proofPhotoUrls; }

    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }

    public BigDecimal getActualCost() { return actualCost; }
    public void setActualCost(BigDecimal actualCost) { this.actualCost = actualCost; }

    public UUID getAssignedBy() { return assignedBy; }
    public void setAssignedBy(UUID assignedBy) { this.assignedBy = assignedBy; }

    public UUID getApprovedBy() { return approvedBy; }
    public void setApprovedBy(UUID approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
}
