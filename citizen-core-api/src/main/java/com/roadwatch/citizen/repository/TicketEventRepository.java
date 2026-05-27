package com.roadwatch.citizen.repository;

import com.roadwatch.citizen.model.entity.TicketEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TicketEventRepository extends JpaRepository<TicketEvent, UUID> {
    List<TicketEvent> findByTicketIdOrderByTimestampAsc(UUID ticketId);
}
