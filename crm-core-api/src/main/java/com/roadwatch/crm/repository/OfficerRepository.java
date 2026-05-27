package com.roadwatch.crm.repository;

import com.roadwatch.crm.model.entity.Officer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OfficerRepository extends JpaRepository<Officer, UUID> {

    @Query(value = "SELECT * FROM officers WHERE role = :role AND jurisdiction_id = :jurisdictionId LIMIT 1", nativeQuery = true)
    Optional<Officer> findByRoleAndJurisdiction(@Param("role") String role, @Param("jurisdictionId") UUID jurisdictionId);

    @Query(value = "SELECT * FROM officers WHERE role = :role AND (jurisdiction_id = :jurisdictionId OR jurisdiction_id = (SELECT parent_id FROM jurisdictions WHERE id = :jurisdictionId)) LIMIT 1", nativeQuery = true)
    Optional<Officer> findByRoleAndJurisdictionTree(@Param("role") String role, @Param("jurisdictionId") UUID jurisdictionId);
}
