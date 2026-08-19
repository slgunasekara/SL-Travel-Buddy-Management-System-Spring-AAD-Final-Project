package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {
}
