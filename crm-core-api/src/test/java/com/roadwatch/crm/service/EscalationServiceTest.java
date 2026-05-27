package com.roadwatch.crm.service;

import com.roadwatch.crm.model.entity.*;
import com.roadwatch.crm.model.enums.*;
import com.roadwatch.crm.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EscalationServiceTest {

    @Mock
    private MasterTicketRepository ticketRepository;

    @Mock
    private OfficerRepository officerRepository;

    @Mock
    private TicketEventRepository eventRepository;

    @InjectMocks
    private EscalationService escalationService;

    @Test
    public void testTC_CRM_02_AutoSlaEscalation() {
        // Arrange
        UUID ticketId = UUID.randomUUID();
        UUID jeId = UUID.randomUUID();
        UUID eeId = UUID.randomUUID();
        UUID wardId = UUID.fromString("447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1");

        MasterTicket ticket = new MasterTicket();
        ticket.setId(ticketId);
        ticket.setAssignedTo(jeId);
        ticket.setJurisdictionId(wardId);
        ticket.setStatus(TicketStatus.ASSIGNED);

        Officer je = new Officer();
        je.setId(jeId);
        je.setRole(OfficerRole.JE);
        je.setJurisdictionId(wardId);

        Officer ee = new Officer();
        ee.setId(eeId);
        ee.setRole(OfficerRole.EE);
        ee.setJurisdictionId(wardId);

        when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket));
        when(officerRepository.findById(jeId)).thenReturn(Optional.of(je));
        when(officerRepository.findByRoleAndJurisdictionTree("EE", wardId)).thenReturn(Optional.of(ee));
        when(ticketRepository.save(any(MasterTicket.class))).thenReturn(ticket);

        TicketEvent savedEvent = new TicketEvent();
        savedEvent.setId(UUID.randomUUID());
        savedEvent.setEventType(EventType.ESCALATED);
        when(eventRepository.save(any(TicketEvent.class))).thenReturn(savedEvent);

        // Act
        TicketEvent event = escalationService.escalateTicket(ticketId, "SLA_BREACH");

        // Assert
        assertNotNull(event);
        assertEquals(EventType.ESCALATED, ticket.getStatus().name() == "ESCALATED" ? EventType.ESCALATED : null);
        verify(ticketRepository, times(1)).save(ticket);
        assertEquals(eeId, ticket.getAssignedTo()); // Assigned to EE
    }
}
