package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.BudgetCap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetCapRepository extends JpaRepository<BudgetCap, Long> {
}
