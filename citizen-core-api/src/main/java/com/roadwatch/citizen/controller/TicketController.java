package com.roadwatch.citizen.controller;

import com.roadwatch.citizen.model.dto.CreateTicketRequest;
import com.roadwatch.citizen.model.dto.TicketResponse;
import com.roadwatch.citizen.model.entity.TicketEvent;
import com.roadwatch.citizen.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/citizen")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @PostMapping("/tickets")
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody CreateTicketRequest req) {
        TicketResponse res = ticketService.createTicket(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable UUID id) {
        return ticketService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tickets/{id}/events")
    public ResponseEntity<List<TicketEvent>> getTicketEvents(@PathVariable UUID id) {
        return ResponseEntity.ok(ticketService.getTicketEvents(id));
    }

    @GetMapping("/tickets/nearby")
    public ResponseEntity<List<TicketResponse>> getNearbyTickets(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1000") double radius) {
        return ResponseEntity.ok(ticketService.getNearbyTickets(lat, lng, radius));
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<TicketResponse>> getMyTickets(@RequestParam UUID citizenId) {
        return ResponseEntity.ok(ticketService.getTicketsByCitizen(citizenId));
    }

    @GetMapping("/tickets/clusters")
    public ResponseEntity<List<Map<String, Object>>> getClusters(
            @RequestParam double swLat,
            @RequestParam double swLng,
            @RequestParam double neLat,
            @RequestParam double neLng,
            @RequestParam(defaultValue = "0.01") double gridSize) {
        return ResponseEntity.ok(ticketService.getClusters(swLat, swLng, neLat, neLng, gridSize));
    }
}
