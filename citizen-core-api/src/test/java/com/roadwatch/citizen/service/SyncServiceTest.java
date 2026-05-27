package com.roadwatch.citizen.service;

import com.roadwatch.citizen.model.dto.CreateTicketRequest;
import com.roadwatch.citizen.model.dto.SyncQueueRequest.SyncAction;
import com.roadwatch.citizen.model.dto.TicketResponse;
import com.roadwatch.citizen.model.entity.TicketContribution;
import com.roadwatch.citizen.repository.TicketContributionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SyncServiceTest {

    @Mock
    private TicketService ticketService;

    @Mock
    private TicketContributionRepository contributionRepository;

    @InjectMocks
    private SyncService syncService;

    @Test
    public void testTC_CIT_03_OfflineBatchQueueSync() {
        // Arrange
        SyncAction action1 = new SyncAction();
        action1.setType("CREATE_TICKET");
        action1.setClientTimestamp("2026-05-28T02:00:00Z");
        action1.setPayload(Map.of(
                "title", "Offline pothole",
                "category", "POTHOLE",
                "lat", 13.061,
                "lng", 80.281
        ));

        SyncAction action2 = new SyncAction();
        action2.setType("CONTRIBUTE");
        action2.setClientTimestamp("2026-05-28T02:01:00Z");
        action2.setPayload(Map.of(
                "masterTicketId", UUID.randomUUID().toString(),
                "description", "Still broken",
                "lat", 13.061,
                "lng", 80.281
        ));

        // Mock create ticket
        TicketResponse resDto = new TicketResponse();
        resDto.setId(UUID.randomUUID());
        resDto.setTitle("Offline pothole");
        when(ticketService.createTicket(any(CreateTicketRequest.class))).thenReturn(resDto);

        // Act
        List<Map<String, Object>> results = syncService.processOfflineActions(List.of(action1, action2));

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        
        assertEquals("SUCCESS", results.get(0).get("status"));
        assertEquals("SUCCESS", results.get(1).get("status"));
        
        verify(ticketService, times(1)).createTicket(any(CreateTicketRequest.class));
        verify(contributionRepository, times(1)).save(any(TicketContribution.class));
    }
}
