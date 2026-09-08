package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.PartPurchase;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartPurchaseRepository extends JpaRepository<PartPurchase, Long> {


    @Query("SELECT p FROM PartPurchase p WHERE p.bus.busId = :busId AND p.status = :status")
    List<PartPurchase> findByBus_BusIdAndStatus(@Param("busId") Long busId, @Param("status") RecordStatus status);

    @Query("SELECT p FROM PartPurchase p WHERE p.maintenance.maintId = :maintId AND p.status = :status")
    List<PartPurchase> findByMaintenance_MaintIdAndStatus(@Param("maintId") Long maintId, @Param("status") RecordStatus status);
}
