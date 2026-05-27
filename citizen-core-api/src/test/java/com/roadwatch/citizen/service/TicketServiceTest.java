package com.roadwatch.citizen.service;

import com.roadwatch.citizen.model.dto.CreateTicketRequest;
import com.roadwatch.citizen.model.dto.TicketResponse;
import com.roadwatch.citizen.model.entity.MasterTicket;
import com.roadwatch.citizen.model.entity.TicketContribution;
import com.roadwatch.citizen.model.enums.TicketCategory;
import com.roadwatch.citizen.model.enums.TicketPriority;
import com.roadwatch.citizen.model.enums.TicketStatus;
import com.roadwatch.citizen.repository.MasterTicketRepository;
import com.roadwatch.citizen.repository.TicketContributionRepository;
import com.roadwatch.citizen.repository.TicketEventRepository;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TicketServiceTest {

    @Mock
    private MasterTicketRepository ticketRepository;

    @Mock
    private TicketContributionRepository contributionRepository;

    @Mock
    private TicketEventRepository eventRepository;

    @Mock
    private AiIntegrationService aiIntegrationService;

    @Mock
    private WebSocketService webSocketService;

    @InjectMocks
    private TicketService ticketService;

    private GeometryFactory geometryFactory;
    private UUID wardId;

    @BeforeEach
    public void setUp() {
        geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        wardId = UUID.fromString("447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1");
    }

    @Test
    public void testTC_CIT_01_SpatialClusteringWithin50m() {
        // Arrange
        CreateTicketRequest req = new CreateTicketRequest();
        req.setTitle("Close pothole");
        req.setCategory(TicketCategory.POTHOLE);
        req.setLat(13.0612);
        req.setLng(80.2811);
        req.setCitizenId(UUID.randomUUID());

        // Mock Geo-routing & Spam Check
        AiIntegrationService.GeoResolveResponse geoRes = new AiIntegrationService.GeoResolveResponse();
        geoRes.setJurisdictionId(wardId);
        geoRes.setBlackspot(false);
        when(aiIntegrationService.resolveGeo(anyDouble(), anyDouble())).thenReturn(Mono.just(geoRes));
        when(aiIntegrationService.filterComplaint(anyDouble(), anyDouble(), anyString(), anyString(), any())).thenReturn(Mono.just(new AiIntegrationService.FilterResponse("PASS", 1.0)));

        // Mock existing MasterTicket within 50m
        MasterTicket existing = new MasterTicket();
        existing.setId(UUID.randomUUID());
        existing.setTitle("Initial Pothole");
        existing.setCategory(TicketCategory.POTHOLE);
        existing.setContributorCount(1);
        existing.setPriority(TicketPriority.NORMAL);
        existing.setLocation(geometryFactory.createPoint(new Coordinate(80.281, 13.061)));
        when(ticketRepository.findNearbyOpenTicket(eq(13.0612), eq(80.2811), eq(50.0), eq(TicketCategory.POTHOLE)))
                .thenReturn(Optional.of(existing));
        when(ticketRepository.save(any(MasterTicket.class))).thenReturn(existing);

        // Act
        TicketResponse res = ticketService.createTicket(req);

        // Assert
        assertNotNull(res);
        assertEquals(2, existing.getContributorCount()); // Contributor Count Incremented
        verify(contributionRepository, times(1)).save(any(TicketContribution.class));
        verify(ticketRepository, times(1)).save(existing);
    }

    @Test
    public void testTC_CIT_02_SpatialNonClusteringOutside50m() {
        // Arrange
        CreateTicketRequest req = new CreateTicketRequest();
        req.setTitle("New Pothole");
        req.setCategory(TicketCategory.POTHOLE);
        req.setLat(13.065);
        req.setLng(80.285);

        AiIntegrationService.GeoResolveResponse geoRes = new AiIntegrationService.GeoResolveResponse();
        geoRes.setJurisdictionId(wardId);
        geoRes.setBlackspot(false);
        when(aiIntegrationService.resolveGeo(anyDouble(), anyDouble())).thenReturn(Mono.just(geoRes));
        when(aiIntegrationService.filterComplaint(anyDouble(), anyDouble(), anyString(), anyString(), any())).thenReturn(Mono.just(new AiIntegrationService.FilterResponse("PASS", 1.0)));

        // No tickets near
        when(ticketRepository.findNearbyOpenTicket(anyDouble(), anyDouble(), anyDouble(), any())).thenReturn(Optional.empty());

        MasterTicket saved = new MasterTicket();
        saved.setId(UUID.randomUUID());
        saved.setTitle("New Pothole");
        saved.setCategory(TicketCategory.POTHOLE);
        saved.setLocation(geometryFactory.createPoint(new Coordinate(80.285, 13.065)));
        saved.setContributorCount(1);
        when(ticketRepository.save(any(MasterTicket.class))).thenReturn(saved);

        // Act
        TicketResponse res = ticketService.createTicket(req);

        // Assert
        assertNotNull(res);
        assertEquals(1, res.getContributorCount());
        verify(contributionRepository, never()).save(any());
        verify(ticketRepository, times(1)).save(any(MasterTicket.class));
    }

    @Test
    public void testTC_FAIL_INT_01_PythonAiOutageResilience() {
        // Arrange
        CreateTicketRequest req = new CreateTicketRequest();
        req.setTitle("Lighting issue");
        req.setCategory(TicketCategory.LIGHTING);
        req.setLat(13.06);
        req.setLng(80.28);

        // Mock outages throwing exception inside Mono stream
        when(aiIntegrationService.resolveGeo(anyDouble(), anyDouble())).thenReturn(Mono.error(new RuntimeException("Service down")));
        when(aiIntegrationService.filterComplaint(anyDouble(), anyDouble(), anyString(), anyString(), any())).thenReturn(Mono.error(new RuntimeException("Service down")));

        when(ticketRepository.findNearbyOpenTicket(anyDouble(), anyDouble(), anyDouble(), any())).thenReturn(Optional.empty());

        MasterTicket saved = new MasterTicket();
        saved.setId(UUID.randomUUID());
        saved.setTitle("Lighting issue");
        saved.setCategory(TicketCategory.LIGHTING);
        saved.setLocation(geometryFactory.createPoint(new Coordinate(80.28, 13.06)));
        saved.setJurisdictionId(wardId); // should fallback to default Ward 42 ID
        saved.setContributorCount(1);
        when(ticketRepository.save(any(MasterTicket.class))).thenReturn(saved);

        // Act & Assert
        assertDoesNotThrow(() -> {
            TicketResponse res = ticketService.createTicket(req);
            assertNotNull(res);
            verify(ticketRepository, times(1)).save(any(MasterTicket.class));
        });
    }
}
