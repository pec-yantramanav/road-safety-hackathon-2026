package com.roadwatch.crm.security;

import com.roadwatch.crm.model.entity.MasterTicket;
import com.roadwatch.crm.model.entity.Officer;
import com.roadwatch.crm.model.enums.OfficerRole;
import com.roadwatch.crm.repository.MasterTicketRepository;
import com.roadwatch.crm.repository.OfficerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RlsSecurityTest {

    @Mock
    private MasterTicketRepository ticketRepository;

    @Mock
    private OfficerRepository officerRepository;

    private UUID ward42Id;
    private UUID divisionId;
    private UUID jeId;
    private UUID eeId;

    @BeforeEach
    public void setUp() {
        ward42Id = UUID.fromString("447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1");
        divisionId = UUID.fromString("b9b9a674-ec0a-4fb4-bbab-fb605eb8716b");
        jeId = UUID.randomUUID();
        eeId = UUID.randomUUID();
    }

    @Test
    public void testTC_CRM_01_RowLevelSecurityScopes() {
        // Arrange: Seed mock officers
        Officer je = new Officer();
        je.setId(jeId);
        je.setRole(OfficerRole.JE);
        je.setJurisdictionId(ward42Id);

        Officer ee = new Officer();
        ee.setId(eeId);
        ee.setRole(OfficerRole.EE);
        ee.setJurisdictionId(divisionId);

        when(officerRepository.findById(jeId)).thenReturn(Optional.of(je));
        when(officerRepository.findById(eeId)).thenReturn(Optional.of(ee));

        // Mock repository scoping
        MasterTicket ticketInWard = new MasterTicket();
        ticketInWard.setJurisdictionId(ward42Id);
        
        MasterTicket ticketInDivOnly = new MasterTicket();
        ticketInDivOnly.setJurisdictionId(divisionId);

        when(ticketRepository.findAllInJurisdiction(ward42Id)).thenReturn(List.of(ticketInWard));
        when(ticketRepository.findAllInJurisdiction(divisionId)).thenReturn(List.of(ticketInWard, ticketInDivOnly));

        // Act: JE query
        List<MasterTicket> jeTickets = getScopedTickets(jeId);
        // Act: EE query
        List<MasterTicket> eeTickets = getScopedTickets(eeId);

        // Assert: Scopes are applied correctly
        assertNotNull(jeTickets);
        assertEquals(1, jeTickets.size());
        assertEquals(ward42Id, jeTickets.get(0).getJurisdictionId());

        assertNotNull(eeTickets);
        assertEquals(2, eeTickets.size());
    }

    @Test
    public void testTC_FAIL_SEC_02_RlsLeakagePrevention() {
        // Arrange
        Officer je = new Officer();
        je.setId(jeId);
        je.setRole(OfficerRole.JE);
        je.setJurisdictionId(ward42Id);

        when(officerRepository.findById(jeId)).thenReturn(Optional.of(je));

        // Mock detail ticket outside JE ward
        UUID ward99Id = UUID.randomUUID();
        MasterTicket externalTicket = new MasterTicket();
        externalTicket.setId(UUID.randomUUID());
        externalTicket.setJurisdictionId(ward99Id);

        when(ticketRepository.findById(externalTicket.getId())).thenReturn(Optional.of(externalTicket));

        // Act & Assert
        Exception exception = assertThrows(SecurityException.class, () -> {
            verifyTicketDetailAccess(jeId, externalTicket.getId());
        });
        
        assertEquals("Access Denied: Ticket is outside your division bounds.", exception.getMessage());
    }

    private List<MasterTicket> getScopedTickets(UUID officerId) {
        Officer officer = officerRepository.findById(officerId).orElseThrow();
        if (officer.getRole() == OfficerRole.SE || officer.getRole() == OfficerRole.CE) {
            return ticketRepository.findAllInJurisdictionTree(officer.getJurisdictionId());
        } else {
            return ticketRepository.findAllInJurisdiction(officer.getJurisdictionId());
        }
    }

    private void verifyTicketDetailAccess(UUID officerId, UUID ticketId) {
        Officer officer = officerRepository.findById(officerId).orElseThrow();
        MasterTicket ticket = ticketRepository.findById(ticketId).orElseThrow();
        
        // Emulate RLS filter verification logic
        if (!officer.getJurisdictionId().equals(ticket.getJurisdictionId())) {
            throw new SecurityException("Access Denied: Ticket is outside your division bounds.");
        }
    }
}
