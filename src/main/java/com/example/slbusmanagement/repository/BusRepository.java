package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.Bus;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {


    @Query("SELECT b FROM Bus b WHERE LOWER(b.busNumber) = LOWER(:busNumber) AND b.status = :status")
    List<Bus> findByBusNumberIgnoreCaseAndStatus(@Param("busNumber") String busNumber, @Param("status") RecordStatus status);

    @Query("SELECT b FROM Bus b WHERE LOWER(b.busNumber) = LOWER(:busNumber) AND b.status = :status AND b.busId <> :excludeId")
    List<Bus> findByBusNumberIgnoreCaseAndStatusExcludingId(@Param("busNumber") String busNumber, @Param("status") RecordStatus status, @Param("excludeId") Long excludeId);

    @Query("SELECT b FROM Bus b WHERE b.status = :status")
    List<Bus> findAllByStatus(@Param("status") RecordStatus status);
}
