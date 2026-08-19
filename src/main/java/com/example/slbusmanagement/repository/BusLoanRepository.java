package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.BusLoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusLoanRepository extends JpaRepository<BusLoan, Long> {
}
