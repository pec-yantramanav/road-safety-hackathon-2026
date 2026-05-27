package com.roadwatch.citizen.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roadwatch.citizen.model.dto.CreateTicketRequest;
import com.roadwatch.citizen.model.dto.SyncQueueRequest.SyncAction;
import com.roadwatch.citizen.model.dto.TicketResponse;
import com.roadwatch.citizen.model.entity.TicketContribution;
import com.roadwatch.citizen.repository.TicketContributionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class SyncService {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private TicketContributionRepository contributionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> processOfflineActions(List<SyncAction> actions) {
        List<Map<String, Object>> results = new ArrayList<>();

        for (SyncAction action : actions) {
            Map<String, Object> result = new HashMap<>();
            result.put("type", action.getType());
            result.put("clientTimestamp", action.getClientTimestamp());

            try {
                switch (action.getType()) {
                    case "CREATE_TICKET":
                        CreateTicketRequest req = objectMapper.convertValue(action.getPayload(), CreateTicketRequest.class);
                        TicketResponse res = ticketService.createTicket(req);
                        result.put("status", "SUCCESS");
                        result.put("data", res);
                        break;

                    case "CONTRIBUTE":
                        UUID masterTicketId = UUID.fromString((String) action.getPayload().get("masterTicketId"));
                        UUID citizenId = action.getPayload().get("citizenId") == null ? null : UUID.fromString((String) action.getPayload().get("citizenId"));
                        String description = (String) action.getPayload().get("description");
                        double lat = Double.parseDouble(action.getPayload().get("lat").toString());
                        double lng = Double.parseDouble(action.getPayload().get("lng").toString());

                        TicketContribution contrib = new TicketContribution();
                        contrib.setMasterTicketId(masterTicketId);
                        contrib.setCitizenId(citizenId);
                        contrib.setDescription(description);
                        contrib.setLat(lat);
                        contrib.setLng(lng);
                        contributionRepository.save(contrib);

                        result.put("status", "SUCCESS");
                        result.put("data", Map.of("contributionId", contrib.getId()));
                        break;

                    default:
                        result.put("status", "FAILED");
                        result.put("error", "Unknown sync action type: " + action.getType());
                }
            } catch (Exception e) {
                result.put("status", "FAILED");
                result.put("error", e.getMessage());
            }
            results.add(result);
        }

        return results;
    }
}
