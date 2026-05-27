package com.roadwatch.crm.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roadwatch.crm.model.entity.*;
import com.roadwatch.crm.model.enums.*;
import com.roadwatch.crm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class EscalationService {

    @Autowired
    private MasterTicketRepository ticketRepository;

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private TicketEventRepository eventRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<OfficerRole, OfficerRole> ESCALATION_CHAIN = Map.of(
            OfficerRole.JE, OfficerRole.AE,
            OfficerRole.AE, OfficerRole.EE,
            OfficerRole.EE, OfficerRole.SE,
            OfficerRole.SE, OfficerRole.CE
    );

    @Transactional
    public TicketEvent escalateTicket(UUID ticketId, String reason) {
        MasterTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        if (ticket.getAssignedTo() == null) {
            throw new IllegalStateException("Ticket is not assigned to anyone yet.");
        }

        Officer currentOfficer = officerRepository.findById(ticket.getAssignedTo())
                .orElseThrow(() -> new IllegalArgumentException("Assigned officer not found: " + ticket.getAssignedTo()));

        OfficerRole nextRole = ESCALATION_CHAIN.get(currentOfficer.getRole());
        if (nextRole == null) {
            // Already at the CE/Commissioner level
            throw new IllegalStateException("Ticket has already reached the maximum escalation tier.");
        }

        // Search for an officer with the next role in the parent or same jurisdiction
        Optional<Officer> nextOfficer = officerRepository.findByRoleAndJurisdictionTree(nextRole.name(), ticket.getJurisdictionId());
        if (nextOfficer.isEmpty()) {
            // Fallback: Find any active officer with the next role
            nextOfficer = officerRepository.findAll().stream()
                    .filter(o -> o.getRole() == nextRole && o.isActive())
                    .findFirst();
        }

        if (nextOfficer.isEmpty()) {
            throw new IllegalStateException("No active officer found with role " + nextRole + " to escalate to.");
        }

        Officer toOfficer = nextOfficer.get();

        // Update ticket assignment
        ticket.setAssignedTo(toOfficer.getId());
        ticket.setStatus(TicketStatus.ESCALATED);

        // Adjust SLA: 48h extra or similar
        ticket.setSlaDeadline(LocalDateTime.now().plusHours(48));
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        // Log escalation event
        TicketEvent event = new TicketEvent();
        event.setTicketId(ticketId);
        event.setActorId(currentOfficer.getId());
        event.setEventType(EventType.ESCALATED);

        try {
            event.setPayload(objectMapper.writeValueAsString(Map.of(
                    "from_officer", currentOfficer.getId().toString(),
                    "to_officer", toOfficer.getId().toString(),
                    "from_role", currentOfficer.getRole().name(),
                    "to_role", toOfficer.getRole().name(),
                    "reason", reason == null ? "SLA_BREACH" : reason
            )));
        } catch (Exception e) {
            // Ignore
        }

        event.setTimestamp(LocalDateTime.now());
        return eventRepository.save(event);
    }
}
