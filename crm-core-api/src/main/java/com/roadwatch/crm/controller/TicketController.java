package com.roadwatch.crm.controller;

import com.roadwatch.crm.model.entity.*;
import com.roadwatch.crm.model.enums.*;
import com.roadwatch.crm.repository.*;
import com.roadwatch.crm.service.EscalationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/crm")
public class TicketController {

    @Autowired
    private MasterTicketRepository ticketRepository;

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private EscalationService escalationService;

    @GetMapping("/tickets")
    public ResponseEntity<List<MasterTicket>> getTickets(
            @RequestParam UUID officerId,
            @RequestParam(required = false) String status) {
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found: " + officerId));

        List<MasterTicket> list;
        if (officer.getRole() == OfficerRole.SE || officer.getRole() == OfficerRole.CE) {
            list = ticketRepository.findAllInJurisdictionTree(officer.getJurisdictionId());
        } else {
            list = ticketRepository.findAllInJurisdiction(officer.getJurisdictionId());
        }

        if (status != null) {
            list = list.stream()
                    .filter(t -> status.equalsIgnoreCase(t.getStatus().name()))
                    .toList();
        }

        return ResponseEntity.ok(list);
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<MasterTicket> getTicketById(@PathVariable UUID id) {
        return ticketRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/tickets/{id}/assign")
    public ResponseEntity<MasterTicket> assignTicket(
            @PathVariable UUID id,
            @RequestParam UUID officerId) {
        MasterTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));

        ticket.setAssignedTo(officerId);
        ticket.setStatus(TicketStatus.ASSIGNED);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        return ResponseEntity.ok(ticket);
    }

    @PatchMapping("/tickets/{id}/status")
    public ResponseEntity<MasterTicket> updateTicketStatus(
            @PathVariable UUID id,
            @RequestParam TicketStatus status) {
        MasterTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));

        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/tickets/{id}/escalate")
    public ResponseEntity<TicketEvent> escalateTicket(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        TicketEvent event = escalationService.escalateTicket(id, reason);
        return ResponseEntity.ok(event);
    }
}
