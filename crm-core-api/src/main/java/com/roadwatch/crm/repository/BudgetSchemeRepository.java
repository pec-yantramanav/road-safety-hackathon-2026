package com.roadwatch.crm.repository;

import com.roadwatch.crm.model.entity.BudgetScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface BudgetSchemeRepository extends JpaRepository<BudgetScheme, UUID> {

    List<BudgetScheme> findByJurisdictionId(UUID jurisdictionId);

    @Query(value = "SELECT scheme_name, SUM(sanctioned_amount), SUM(released_amount), SUM(utilized_amount) FROM budget_schemes WHERE jurisdiction_id = :jurisdictionId GROUP BY scheme_name", nativeQuery = true)
    List<Object[]> summaryByScheme(@Param("jurisdictionId") UUID jurisdictionId);
}
