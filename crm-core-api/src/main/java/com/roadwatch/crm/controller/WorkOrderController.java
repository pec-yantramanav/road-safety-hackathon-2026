package com.roadwatch.crm.controller;

import com.roadwatch.crm.model.entity.WorkOrder;
import com.roadwatch.crm.repository.WorkOrderRepository;
import com.roadwatch.crm.service.WorkOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/crm")
public class WorkOrderController {

    @Autowired
    private WorkOrderService workOrderService;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @PostMapping("/workorders")
    public ResponseEntity<WorkOrder> createWorkOrder(
            @RequestParam UUID ticketId,
            @RequestParam UUID contractorId,
            @RequestParam BigDecimal estimatedCost,
            @RequestParam String description,
            @RequestParam UUID officerId) {
        WorkOrder order = workOrderService.createWorkOrder(ticketId, contractorId, estimatedCost, description, officerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/workorders")
    public ResponseEntity<List<WorkOrder>> getWorkOrders(@RequestParam(required = false) UUID contractorId) {
        List<WorkOrder> list;
        if (contractorId != null) {
            list = workOrderRepository.findByContractorId(contractorId);
        } else {
            list = workOrderRepository.findAll();
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/workorders/{id}")
    public ResponseEntity<WorkOrder> getWorkOrderById(@PathVariable UUID id) {
        return workOrderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/workorders/{id}/submit")
    public ResponseEntity<WorkOrder> submitProofOfWork(
            @PathVariable UUID id,
            @RequestBody List<String> proofPhotoUrls) {
        WorkOrder order = workOrderService.submitProofOfWork(id, proofPhotoUrls);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/workorders/{id}/approve")
    public ResponseEntity<WorkOrder> approveWorkOrder(
            @PathVariable UUID id,
            @RequestParam UUID officerId) {
        WorkOrder order = workOrderService.approveWorkOrder(id, officerId);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/workorders/{id}/reject")
    public ResponseEntity<WorkOrder> rejectWorkOrder(
            @PathVariable UUID id,
            @RequestParam UUID officerId) {
        WorkOrder order = workOrderService.rejectWorkOrder(id, officerId);
        return ResponseEntity.ok(order);
    }
}
