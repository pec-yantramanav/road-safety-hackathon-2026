package com.roadwatch.citizen.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roadwatch.citizen.model.dto.CreateTicketRequest;
import com.roadwatch.citizen.model.dto.TicketResponse;
import com.roadwatch.citizen.model.entity.*;
import com.roadwatch.citizen.model.enums.*;
import com.roadwatch.citizen.repository.*;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TicketService {

    @Autowired
    private MasterTicketRepository ticketRepository;

    @Autowired
    private TicketContributionRepository contributionRepository;

    @Autowired
    private TicketEventRepository eventRepository;

    @Autowired
    private AiIntegrationService aiIntegrationService;

    @Autowired
    private WebSocketService webSocketService;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest req) {
        // Step 1: Call Python AI for geo resolution
        AiIntegrationService.GeoResolveResponse geo = aiIntegrationService.resolveGeo(req.getLat(), req.getLng()).block();

        // Step 2: Call Python AI for spam filtering
        AiIntegrationService.FilterResponse filter = aiIntegrationService.filterComplaint(
                req.getLat(), req.getLng(), req.getCategory().name(), req.getDescription(), req.getCitizenId()
        ).block();

        if (filter != null && "REJECT".equals(filter.getVerdict())) {
            throw new IllegalArgumentException("Complaint rejected as spam.");
        }

        // Step 3: Spatial clustering check (50 meters, same category, status is OPEN/ASSIGNED/IN_PROGRESS)
        Optional<MasterTicket> existing = ticketRepository.findNearbyOpenTicket(
                req.getLat(), req.getLng(), 50.0, req.getCategory()
        );

        MasterTicket master;
        if (existing.isPresent()) {
            master = existing.get();
            // Record as a contribution
            TicketContribution contribution = new TicketContribution();
            contribution.setMasterTicketId(master.getId());
            contribution.setCitizenId(req.getCitizenId());
            contribution.setDescription(req.getDescription());
            contribution.setPhotoUrls(req.getPhotoUrls());
            contribution.setLat(req.getLat());
            contribution.setLng(req.getLng());
            contributionRepository.save(contribution);

            // Increment count and upgrade priority
            master.setContributorCount(master.getContributorCount() + 1);
            if (master.getContributorCount() >= 5 && master.getPriority() == TicketPriority.NORMAL) {
                master.setPriority(TicketPriority.HIGH);
            }
            master.setUpdatedAt(LocalDateTime.now());
            master = ticketRepository.save(master);

            // Log event
            saveEvent(master.getId(), req.getCitizenId(), EventType.COMMENTED, Map.of(
                    "type", "CONTRIBUTION",
                    "description", req.getDescription(),
                    "contributor_count", master.getContributorCount()
            ));

        } else {
            // Create a new MasterTicket
            master = new MasterTicket();
            master.setTitle(req.getTitle());
            master.setDescription(req.getDescription());
            master.setCategory(req.getCategory());
            master.setLocation(geometryFactory.createPoint(new Coordinate(req.getLng(), req.getLat())));
            master.setPhotoUrls(req.getPhotoUrls());
            master.setAnonymous(req.isAnonymous());
            master.setContributorCount(1);
            master.setCitizenId(req.isAnonymous() ? null : req.getCitizenId());
            master.setJurisdictionId(geo != null ? geo.getJurisdictionId() : null);
            master.setAuthorityType(geo != null ? geo.getAuthorityType() : AuthorityType.MUNICIPAL);

            // Set Priority & SLA
            if (geo != null && geo.isBlackspot()) {
                master.setPriority(TicketPriority.BLACKSPOT);
                master.setSlaDeadline(LocalDateTime.now().plusHours(24)); // 24h for Blackspot
            } else {
                master.setPriority(TicketPriority.NORMAL);
                master.setSlaDeadline(LocalDateTime.now().plusHours(72)); // 72h default
            }

            master = ticketRepository.save(master);

            // Log event
            saveEvent(master.getId(), req.getCitizenId(), EventType.CREATED, Map.of(
                    "title", req.getTitle(),
                    "category", req.getCategory().name()
            ));
        }

        return mapToResponse(master);
    }

    public List<TicketResponse> getNearbyTickets(double lat, double lng, double radiusMeters) {
        return ticketRepository.findNearbyTickets(lat, lng, radiusMeters)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public Optional<TicketResponse> getTicketById(UUID id) {
        return ticketRepository.findById(id).map(this::mapToResponse);
    }

    public List<TicketEvent> getTicketEvents(UUID ticketId) {
        return eventRepository.findByTicketIdOrderByTimestampAsc(ticketId);
    }

    public List<TicketResponse> getTicketsByCitizen(UUID citizenId) {
        // Basic list implementation
        return ticketRepository.findAll()
                .stream()
                .filter(t -> citizenId.equals(t.getCitizenId()))
                .map(this::mapToResponse)
                .toList();
    }

    public List<Map<String, Object>> getClusters(double swLat, double swLng, double neLat, double neLng, double gridSize) {
        List<Object[]> rows = ticketRepository.findClustersRaw(swLat, swLng, neLat, neLng, gridSize);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            String wktPoint = (String) row[0];
            Long count = (Long) row[1];
            if (wktPoint != null) {
                // simple parse Point(LNG LAT)
                String coords = wktPoint.substring(wktPoint.indexOf("(") + 1, wktPoint.indexOf(")"));
                String[] split = coords.split(" ");
                double lng = Double.parseDouble(split[0]);
                double lat = Double.parseDouble(split[1]);
                result.add(Map.of(
                        "center", Map.of("lat", lat, "lng", lng),
                        "count", count,
                        "severity", count >= 5 ? "HIGH" : "NORMAL"
                ));
            }
        }
        return result;
    }

    private void saveEvent(UUID ticketId, UUID actorId, EventType eventType, Map<String, Object> payload) {
        try {
            TicketEvent event = new TicketEvent();
            event.setTicketId(ticketId);
            event.setActorId(actorId);
            event.setEventType(eventType);
            event.setPayload(objectMapper.writeValueAsString(payload));
            event.setTimestamp(LocalDateTime.now());
            eventRepository.save(event);

            // Broadcast real-time ticket event
            webSocketService.broadcastTicketEvent(ticketId, event);
        } catch (Exception e) {
            // Ignore mapping error
        }
    }

    private TicketResponse mapToResponse(MasterTicket master) {
        TicketResponse res = new TicketResponse();
        res.setId(master.getId());
        res.setTitle(master.getTitle());
        res.setDescription(master.getDescription());
        res.setStatus(master.getStatus());
        res.setPriority(master.getPriority());
        res.setCategory(master.getCategory());
        res.setLat(master.getLocation().getY());
        res.setLng(master.getLocation().getX());
        res.setClusterRadiusM(master.getClusterRadiusM());
        res.setPhotoUrls(master.getPhotoUrls());
        res.setAnonymous(master.isAnonymous());
        res.setContributorCount(master.getContributorCount());
        res.setCitizenId(master.getCitizenId());
        res.setAssignedTo(master.getAssignedTo());
        res.setJurisdictionId(master.getJurisdictionId());
        res.setAuthorityType(master.getAuthorityType());
        res.setSlaDeadline(master.getSlaDeadline());
        res.setCreatedAt(master.getCreatedAt());
        res.setUpdatedAt(master.getUpdatedAt());
        return res;
    }
}
