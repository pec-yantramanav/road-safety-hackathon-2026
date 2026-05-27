package com.roadwatch.crm.controller;

import com.roadwatch.crm.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/crm")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@RequestParam UUID officerId) {
        return ResponseEntity.ok(dashboardService.getRoleSpecificStats(officerId));
    }
}
