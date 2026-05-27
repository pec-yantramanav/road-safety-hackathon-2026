package com.roadwatch.crm.model.entity;

import com.roadwatch.crm.model.enums.AuthorityType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "budget_schemes")
public class BudgetScheme {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "scheme_name", nullable = false)
    private String schemeName;

    @Column(nullable = false)
    private UUID jurisdictionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthorityType authorityType;

    @Column(nullable = false)
    private BigDecimal sanctionedAmount;

    @Column(nullable = false)
    private BigDecimal releasedAmount;

    private BigDecimal utilizedAmount = BigDecimal.ZERO;

    @Column(name = "financial_year", nullable = false)
    private String financialYear;

    @Column(name = "source_ref")
    private String sourceRef;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSchemeName() { return schemeName; }
    public void setSchemeName(String schemeName) { this.schemeName = schemeName; }

    public UUID getJurisdictionId() { return jurisdictionId; }
    public void setJurisdictionId(UUID jurisdictionId) { this.jurisdictionId = jurisdictionId; }

    public AuthorityType getAuthorityType() { return authorityType; }
    public void setAuthorityType(AuthorityType authorityType) { this.authorityType = authorityType; }

    public BigDecimal getSanctionedAmount() { return sanctionedAmount; }
    public void setSanctionedAmount(BigDecimal sanctionedAmount) { this.sanctionedAmount = sanctionedAmount; }

    public BigDecimal getReleasedAmount() { return releasedAmount; }
    public void setReleasedAmount(BigDecimal releasedAmount) { this.releasedAmount = releasedAmount; }

    public BigDecimal getUtilizedAmount() { return utilizedAmount; }
    public void setUtilizedAmount(BigDecimal utilizedAmount) { this.utilizedAmount = utilizedAmount; }

    public String getFinancialYear() { return financialYear; }
    public void setFinancialYear(String financialYear) { this.financialYear = financialYear; }

    public String getSourceRef() { return sourceRef; }
    public void setSourceRef(String sourceRef) { this.sourceRef = sourceRef; }
}
