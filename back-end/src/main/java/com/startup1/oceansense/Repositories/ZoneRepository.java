package com.startup1.oceansense.Repositories;

import com.startup1.oceansense.Models.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Long> {

    /*
     * Task 308-1: Server-side Point-in-Polygon validation
     * This query checks if the incoming vessel GPS point falls inside
     * the GEOMETRY(Polygon) of any restricted zone in the database
     */
    // check if zone with same name already exists
    boolean existsByName(String name);
    // Query is sent to PostgreSQL database without any translation, as Spring does not understand
    // PostGIS functions like ST_Contains and ST_SetSRID, hence the use of flag nativeQuery = true
    @Query(value = "SELECT * FROM zones WHERE ST_Contains(coordinates, ST_SetSRID(ST_Point(:lng, :lat), 4326)) AND color = 'red'",
            nativeQuery = true)
    List<Zone> findZonesContainingPoint(@Param("lng") Double lng, @Param("lat") Double lat);

    // ST_MakeLine() draws a line between old point and new point, and checks if it hits any zones using ST_Intersects()
    @Query(value = "SELECT * FROM zones WHERE ST_Intersects(coordinates, ST_MakeLine(ST_SetSRID(ST_Point(:oldLng, :oldLat), 4326), ST_SetSRID(ST_Point(:newLng, :newLat), 4326))) AND color = 'red'", nativeQuery = true)
    List<Zone> findZonesIntersectingPath(
            @Param("oldLng") Double oldLng, @Param("oldLat") Double oldLat,
            @Param("newLng") Double newLng, @Param("newLat") Double newLat);

    // Enforce permanent order by ID
    List<Zone> findAllByOrderByIdAsc();
}
