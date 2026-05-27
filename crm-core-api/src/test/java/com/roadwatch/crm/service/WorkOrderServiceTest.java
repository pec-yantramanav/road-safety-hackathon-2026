package com.roadwatch.crm.service;

import com.roadwatch.crm.model.entity.*;
import com.roadwatch.crm.model.enums.*;
import com.roadwatch.crm.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkOrderServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private MasterTicketRepository ticketRepository;

    @Mock
    private TicketEventRepository eventRepository;

    @Mock
    private BudgetSchemeRepository budgetSchemeRepository;

    @Mock
    private AiIntegrationService aiIntegrationService;

    @InjectMocks
    private WorkOrderService workOrderService;

    @Test
    public void testTC_CRM_03_WorkOrderApprovalAndBudgetDeduction() {
        // Arrange
        UUID woId = UUID.randomUUID();
        UUID ticketId = UUID.randomUUID();
        UUID contractorId = UUID.randomUUID();
        UUID officerId = UUID.randomUUID();
        UUID wardId = UUID.fromString("447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1");
        
        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        Point point = geometryFactory.createPoint(new Coordinate(80.281, 13.061));

        WorkOrder order = new WorkOrder();
        order.setId(woId);
        order.setTicketId(ticketId);
        order.setContractorId(contractorId);
        order.setEstimatedCost(new BigDecimal("120000.00"));
        order.setStatus(WorkOrderStatus.SUBMITTED);

        MasterTicket ticket = new MasterTicket();
        ticket.setId(ticketId);
        ticket.setJurisdictionId(wardId);
        ticket.setLocation(point);
        ticket.setStatus(TicketStatus.IN_PROGRESS);

        BudgetScheme scheme = new BudgetScheme();
        scheme.setJurisdictionId(wardId);
        scheme.setSanctionedAmount(new BigDecimal("5000000.00"));
        scheme.setReleasedAmount(new BigDecimal("3500000.00"));
        scheme.setUtilizedAmount(new BigDecimal("1000000.00"));

        when(workOrderRepository.findById(woId)).thenReturn(Optional.of(order));
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(budgetSchemeRepository.findByJurisdictionId(wardId)).thenReturn(List.of(scheme));
        
        when(workOrderRepository.save(any(WorkOrder.class))).thenReturn(order);
        when(ticketRepository.save(any(MasterTicket.class))).thenReturn(ticket);
        when(budgetSchemeRepository.save(any(BudgetScheme.class))).thenReturn(scheme);
        
        // Mock UC Async trigger
        when(aiIntegrationService.generateUc(any(), any())).thenReturn(Mono.just(new AiIntegrationService.UcResponse("http://mock-pdf.pdf", "Success")));

        // Act
        WorkOrder res = workOrderService.approveWorkOrder(woId, officerId);

        // Assert
        assertNotNull(res);
        assertEquals(WorkOrderStatus.APPROVED, res.getStatus());
        assertEquals(TicketStatus.RESOLVED, ticket.getStatus()); // Ticket set to RESOLVED
        assertEquals(new BigDecimal("1120000.00"), scheme.getUtilizedAmount()); // Budget utilized amount deducted correctly!
        
        verify(workOrderRepository, times(1)).save(order);
        verify(ticketRepository, times(1)).save(ticket);
        verify(budgetSchemeRepository, times(1)).save(scheme);
    }
}
