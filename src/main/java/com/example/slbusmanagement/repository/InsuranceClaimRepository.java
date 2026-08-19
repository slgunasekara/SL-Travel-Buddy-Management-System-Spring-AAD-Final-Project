package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.InsuranceClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InsuranceClaimRepository extends JpaRepository<InsuranceClaim, Long> {
}
