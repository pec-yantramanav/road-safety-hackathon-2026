package com.roadwatch.crm.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roadwatch.crm.model.entity.*;
import com.roadwatch.crm.model.enums.*;
import com.roadwatch.crm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class WorkOrderService {

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Autowired
    private MasterTicketRepository ticketRepository;

    @Autowired
    private TicketEventRepository eventRepository;

    @Autowired
    private BudgetSchemeRepository budgetSchemeRepository;

    @Autowired
    private AiIntegrationService aiIntegrationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public WorkOrder createWorkOrder(UUID ticketId, UUID contractorId, BigDecimal estimatedCost, String description, UUID officerId) {
        MasterTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        WorkOrder order = new WorkOrder();
        order.setTicketId(ticketId);
        order.setContractorId(contractorId);
        order.setStatus(WorkOrderStatus.ASSIGNED);
        order.setEstimatedCost(estimatedCost);
        order.setDescription(description);
        order.setAssignedBy(officerId);
        order.setAssignedAt(LocalDateTime.now());
        workOrderRepository.save(order);

        // Update ticket status
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setAssignedTo(officerId);
        ticketRepository.save(ticket);

        // Log ticket event
        saveEvent(ticketId, officerId, EventType.ASSIGNED, Map.of(
                "contractor_id", contractorId.toString(),
                "estimated_cost", estimatedCost.toString()
        ));

        return order;
    }

    @Transactional
    public WorkOrder submitProofOfWork(UUID workOrderId, List<String> proofPhotoUrls) {
        WorkOrder order = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found: " + workOrderId));

        MasterTicket ticket = ticketRepository.findById(order.getTicketId())
                .orElseThrow(() -> new IllegalArgumentException("Associated ticket not found: " + order.getTicketId()));

        order.setStatus(WorkOrderStatus.SUBMITTED);
        order.setProofPhotoUrls(proofPhotoUrls);
        order.setSubmittedAt(LocalDateTime.now());
        workOrderRepository.save(order);

        // Call FastAPI AI to validate before/after photos and EXIF GPS
        String beforePhoto = (ticket.getPhotoUrls() != null && !ticket.getPhotoUrls().isEmpty()) ? ticket.getPhotoUrls().getFirst() : null;
        String afterPhoto = (proofPhotoUrls != null && !proofPhotoUrls.isEmpty()) ? proofPhotoUrls.getFirst() : null;

        aiIntegrationService.validateWorkOrder(
                workOrderId,
                ticket.getLocation().getY(),
                ticket.getLocation().getX(),
                beforePhoto,
                afterPhoto
        ).subscribe(aiRes -> {
            if ("APPROVED".equals(aiRes.getVerdict())) {
                // Heuristic Auto-Approval can be enabled or EE manually reviews.
                // We keep it as SUBMITTED with AI flags logged.
            }
        });

        return order;
    }

    @Transactional
    public WorkOrder approveWorkOrder(UUID workOrderId, UUID officerId) {
        WorkOrder order = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found: " + workOrderId));

        MasterTicket ticket = ticketRepository.findById(order.getTicketId())
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + order.getTicketId()));

        order.setStatus(WorkOrderStatus.APPROVED);
        order.setApprovedBy(officerId);
        order.setApprovedAt(LocalDateTime.now());
        order.setActualCost(order.getEstimatedCost()); // assume estimated cost initially
        workOrderRepository.save(order);

        // Deduct utilized funds from budget scheme
        List<BudgetScheme> schemes = budgetSchemeRepository.findByJurisdictionId(ticket.getJurisdictionId());
        if (!schemes.isEmpty()) {
            BudgetScheme scheme = schemes.getFirst();
            scheme.setUtilizedAmount(scheme.getUtilizedAmount().add(order.getEstimatedCost()));
            budgetSchemeRepository.save(scheme);
        }

        // Complete ticket status
        ticket.setStatus(TicketStatus.RESOLVED);
        ticketRepository.save(ticket);

        // Log resolved event
        saveEvent(ticket.getId(), officerId, EventType.RESOLVED, Map.of(
                "workorder_id", workOrderId.toString(),
                "actual_cost", order.getEstimatedCost().toString()
        ));

        // Trigger PDF Utilization Certificate (UC) draft generation asynchronously
        aiIntegrationService.generateUc(workOrderId, officerId).subscribe();

        return order;
    }

    @Transactional
    public WorkOrder rejectWorkOrder(UUID workOrderId, UUID officerId) {
        WorkOrder order = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("WorkOrder not found: " + workOrderId));

        order.setStatus(WorkOrderStatus.REJECTED);
        workOrderRepository.save(order);

        return order;
    }

    private void saveEvent(UUID ticketId, UUID actorId, EventType eventType, Map<String, Object> payload) {
        try {
            TicketEvent event = new TicketEvent();
            event.setTicketId(ticketId);
            event.setActorId(actorId);
            event.setEventType(eventType);
            event.setPayload(objectMapper.writeValueAsString(payload));
            event.setTimestamp(LocalDateTime.now());
            eventRepository.save(event);
        } catch (Exception e) {
            // Ignore
        }
    }
}
