package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.OtherService;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OtherServiceRepository extends JpaRepository<OtherService, Long> {


    @Query("SELECT s FROM OtherService s WHERE s.status = :status " +
           "AND s.date BETWEEN :from AND :to ORDER BY s.date DESC")
    List<OtherService> findByStatusAndDateBetween(@Param("status") RecordStatus status,
                                                   @Param("from") LocalDate from,
                                                   @Param("to") LocalDate to);

    @Query("SELECT s FROM OtherService s WHERE s.trip.tripId = :tripId AND s.status = :status")
    List<OtherService> findByTrip_TripIdAndStatus(@Param("tripId") Long tripId, @Param("status") RecordStatus status);


    boolean existsByBus_BusIdAndStatus(Long busId, RecordStatus status);
}
