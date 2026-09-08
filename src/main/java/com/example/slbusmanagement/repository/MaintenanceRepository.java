package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.Maintenance;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {


    @Query("SELECT m FROM Maintenance m WHERE m.bus.busId = :busId AND m.serviceDate IS NOT NULL ORDER BY m.serviceDate DESC")
    List<Maintenance> findByBus_BusIdOrderByServiceDateDesc(@Param("busId") Long busId);

    @Query("SELECT m FROM Maintenance m WHERE m.status = :status")
    List<Maintenance> findAllByStatus(@Param("status") RecordStatus status);


    boolean existsByBus_BusIdAndStatus(Long busId, RecordStatus status);
}
