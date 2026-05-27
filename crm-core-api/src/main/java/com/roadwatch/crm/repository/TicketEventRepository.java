package com.roadwatch.crm.repository;

import com.roadwatch.crm.model.entity.TicketEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface TicketEventRepository extends JpaRepository<TicketEvent, UUID> {
}
