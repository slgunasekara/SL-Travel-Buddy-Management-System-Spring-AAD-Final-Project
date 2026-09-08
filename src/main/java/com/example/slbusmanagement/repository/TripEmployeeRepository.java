package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.TripEmployee;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripEmployeeRepository extends JpaRepository<TripEmployee, Long> {

    @Query("SELECT te FROM TripEmployee te WHERE te.status = :status")
    List<TripEmployee> findAllByStatus(@Param("status") RecordStatus status);


    @Query("SELECT te FROM TripEmployee te WHERE te.trip.tripId = :tripId AND te.status = :status")
    List<TripEmployee> findByTrip_TripIdAndStatus(@Param("tripId") Long tripId, @Param("status") RecordStatus status);
}
