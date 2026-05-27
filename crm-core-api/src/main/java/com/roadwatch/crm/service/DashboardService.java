package com.roadwatch.crm.service;

import com.roadwatch.crm.model.entity.*;
import com.roadwatch.crm.model.enums.*;
import com.roadwatch.crm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class DashboardService {

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private MasterTicketRepository ticketRepository;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Autowired
    private BudgetSchemeRepository budgetSchemeRepository;

    public Map<String, Object> getRoleSpecificStats(UUID officerId) {
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found: " + officerId));

        Map<String, Object> stats = new HashMap<>();
        stats.put("officerName", officer.getName());
        stats.put("role", officer.getRole().name());
        stats.put("jurisdictionId", officer.getJurisdictionId());

        switch (officer.getRole()) {
            case JE:
                stats.put("assignedTickets", ticketRepository.countByAssignedToAndStatus(officerId));
                stats.put("overdueTickets", ticketRepository.countOverdue(officerId));
                stats.put("pendingInspections", workOrderRepository.countByStatusAndJurisdiction(WorkOrderStatus.SUBMITTED, officer.getJurisdictionId()));
                break;

            case EE:
                long openCount = ticketRepository.countOpenInJurisdiction(officer.getJurisdictionId());
                long pendingApprovals = workOrderRepository.countPendingApproval(officer.getJurisdictionId());
                stats.put("divisionOpenTickets", openCount);
                stats.put("pendingApprovals", pendingApprovals);

                // Fetch budgets
                List<BudgetScheme> schemes = budgetSchemeRepository.findByJurisdictionId(officer.getJurisdictionId());
                BigDecimal totalSanctioned = BigDecimal.ZERO;
                BigDecimal totalUtilized = BigDecimal.ZERO;
                for (BudgetScheme scheme : schemes) {
                    totalSanctioned = totalSanctioned.add(scheme.getSanctionedAmount());
                    totalUtilized = totalUtilized.add(scheme.getUtilizedAmount());
                }
                stats.put("totalSanctionedAmount", totalSanctioned);
                stats.put("totalUtilizedAmount", totalUtilized);
                stats.put("budgetUtilizationRate", totalSanctioned.compareTo(BigDecimal.ZERO) > 0 
                        ? totalUtilized.multiply(new BigDecimal(100)).divide(totalSanctioned, 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO);
                break;

            case SE:
            case CE:
                List<Object[]> budgetSummary = budgetSchemeRepository.summaryByScheme(officer.getJurisdictionId());
                List<Map<String, Object>> schemesAgg = new ArrayList<>();
                for (Object[] summary : budgetSummary) {
                    schemesAgg.add(Map.of(
                            "schemeName", summary[0],
                            "sanctioned", summary[1],
                            "released", summary[2],
                            "utilized", summary[3]
                    ));
                }
                stats.put("schemesBudgetSummary", schemesAgg);
                stats.put("totalDivisionTicketsCount", ticketRepository.findAllInJurisdictionTree(officer.getJurisdictionId()).size());
                break;
        }

        return stats;
    }
}
