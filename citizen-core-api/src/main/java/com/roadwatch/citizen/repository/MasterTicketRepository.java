package com.roadwatch.citizen.repository;

import com.roadwatch.citizen.model.entity.MasterTicket;
import com.roadwatch.citizen.model.enums.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MasterTicketRepository extends JpaRepository<MasterTicket, UUID> {

    @Query(value = "SELECT * FROM master_tickets WHERE status = 'OPEN' AND category = :#{#category.name()} AND ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :distanceMeters) LIMIT 1", nativeQuery = true)
    Optional<MasterTicket> findNearbyOpenTicket(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("distanceMeters") double distanceMeters,
        @Param("category") TicketCategory category
    );

    @Query(value = "SELECT * FROM master_tickets WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)", nativeQuery = true)
    List<MasterTicket> findNearbyTickets(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusMeters") double radiusMeters
    );

    @Query(value = "SELECT t.citizen_id FROM master_tickets t WHERE t.citizen_id = :citizenId", nativeQuery = true)
    List<UUID> findTicketIdsByCitizenId(@Param("citizenId") UUID citizenId);

    // Grid snap mapping projection query
    @Query(value = "SELECT ST_AsText(ST_Centroid(ST_Collect(location))) as center, COUNT(*) as count FROM master_tickets WHERE ST_Within(location, ST_MakeEnvelope(:swLng, :swLat, :neLng, :neLat, 4326)) AND status NOT IN ('CLOSED','RESOLVED') GROUP BY ST_SnapToGrid(location, :gridSize)", nativeQuery = true)
    List<Object[]> findClustersRaw(
        @Param("swLat") double swLat,
        @Param("swLng") double swLng,
        @Param("neLat") double neLat,
        @Param("neLng") double neLng,
        @Param("gridSize") double gridSize
    );
}
