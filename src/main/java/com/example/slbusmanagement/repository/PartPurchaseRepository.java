package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.PartPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartPurchaseRepository extends JpaRepository<PartPurchase, Long> {
}
