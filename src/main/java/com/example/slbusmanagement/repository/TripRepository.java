package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.Trip;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {


    @Query("SELECT t FROM Trip t WHERE t.status = :status AND t.tripDate BETWEEN :from AND :to")
    List<Trip> findByStatusAndTripDateBetween(@Param("status") RecordStatus status,
                                               @Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    @Query("SELECT t FROM Trip t WHERE t.status = :status")
    List<Trip> findAllByStatus(@Param("status") RecordStatus status);


    boolean existsByBus_BusIdAndStatus(Long busId, RecordStatus status);
}
