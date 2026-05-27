package com.roadwatch.citizen.service;

import com.roadwatch.citizen.model.entity.TicketEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void broadcastTicketEvent(UUID ticketId, TicketEvent event) {
        messagingTemplate.convertAndSend(
                "/topic/tickets/" + ticketId,
                event
        );
    }
}
