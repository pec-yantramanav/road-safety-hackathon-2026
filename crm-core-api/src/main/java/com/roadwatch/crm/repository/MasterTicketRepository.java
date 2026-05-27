package com.roadwatch.crm.repository;

import com.roadwatch.crm.model.entity.MasterTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface MasterTicketRepository extends JpaRepository<MasterTicket, UUID> {

    @Query("SELECT t FROM MasterTicket t WHERE t.jurisdictionId = :jurisdictionId")
    List<MasterTicket> findAllInJurisdiction(@Param("jurisdictionId") UUID jurisdictionId);

    @Query(value = "SELECT * FROM master_tickets t WHERE t.jurisdiction_id = :jurisdictionId OR t.jurisdiction_id IN (SELECT id FROM jurisdictions WHERE parent_id = :jurisdictionId)", nativeQuery = true)
    List<MasterTicket> findAllInJurisdictionTree(@Param("jurisdictionId") UUID jurisdictionId);

    @Query("SELECT COUNT(t) FROM MasterTicket t WHERE t.jurisdictionId = :jurisdictionId AND t.status IN (com.roadwatch.crm.model.enums.TicketStatus.OPEN, com.roadwatch.crm.model.enums.TicketStatus.ASSIGNED, com.roadwatch.crm.model.enums.TicketStatus.ESCALATED)")
    long countOpenInJurisdiction(@Param("jurisdictionId") UUID jurisdictionId);

    @Query("SELECT COUNT(t) FROM MasterTicket t WHERE t.assignedTo = :officerId AND t.status = com.roadwatch.crm.model.enums.TicketStatus.OPEN")
    long countByAssignedToAndStatus(@Param("officerId") UUID officerId);

    @Query("SELECT COUNT(t) FROM MasterTicket t WHERE t.assignedTo = :officerId AND t.slaDeadline < CURRENT_TIMESTAMP AND t.status NOT IN (com.roadwatch.crm.model.enums.TicketStatus.RESOLVED, com.roadwatch.crm.model.enums.TicketStatus.CLOSED)")
    long countOverdue(@Param("officerId") UUID officerId);
}
