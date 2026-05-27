package com.roadwatch.citizen.controller;

import com.roadwatch.citizen.model.dto.SyncQueueRequest;
import com.roadwatch.citizen.service.SyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/citizen")
public class SyncController {

    @Autowired
    private SyncService syncService;

    @PostMapping("/sync/queue")
    public ResponseEntity<List<Map<String, Object>>> syncQueue(@RequestBody SyncQueueRequest request) {
        if (request == null || request.getActions() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(syncService.processOfflineActions(request.getActions()));
    }
}
