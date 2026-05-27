package com.roadwatch.citizen.repository;

import com.roadwatch.citizen.model.entity.TicketContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TicketContributionRepository extends JpaRepository<TicketContribution, UUID> {
    List<TicketContribution> findByMasterTicketId(UUID masterTicketId);
}
