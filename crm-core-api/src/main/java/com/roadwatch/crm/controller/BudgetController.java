package com.roadwatch.crm.controller;

import com.roadwatch.crm.model.entity.BudgetScheme;
import com.roadwatch.crm.repository.BudgetSchemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/crm")
public class BudgetController {

    @Autowired
    private BudgetSchemeRepository budgetSchemeRepository;

    @GetMapping("/budget")
    public ResponseEntity<List<BudgetScheme>> getBudgets(@RequestParam UUID jurisdictionId) {
        return ResponseEntity.ok(budgetSchemeRepository.findByJurisdictionId(jurisdictionId));
    }

    @GetMapping("/budget/schemes")
    public ResponseEntity<List<String>> getSchemeNames() {
        return ResponseEntity.ok(List.of("PMGSY", "BHARATMALA", "SMART_CITIES"));
    }

    @GetMapping("/budget/{id}")
    public ResponseEntity<BudgetScheme> getBudgetById(@PathVariable UUID id) {
        return budgetSchemeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
