package com.roadwatch.crm.repository;

import com.roadwatch.crm.model.entity.WorkOrder;
import com.roadwatch.crm.model.enums.WorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID> {

    @Query(value = "SELECT COUNT(*) FROM work_orders w JOIN master_tickets t ON w.ticket_id = t.id WHERE w.status = :#{#status.name()} AND t.jurisdiction_id = :jurisdictionId", nativeQuery = true)
    long countByStatusAndJurisdiction(@Param("status") WorkOrderStatus status, @Param("jurisdictionId") UUID jurisdictionId);

    @Query(value = "SELECT COUNT(*) FROM work_orders w JOIN master_tickets t ON w.ticket_id = t.id WHERE w.status = 'SUBMITTED' AND t.jurisdiction_id = :jurisdictionId", nativeQuery = true)
    long countPendingApproval(@Param("jurisdictionId") UUID jurisdictionId);

    List<WorkOrder> findByContractorId(UUID contractorId);
}
