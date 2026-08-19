package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.SalaryRateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryRateHistoryRepository extends JpaRepository<SalaryRateHistory, Long> {
    List<SalaryRateHistory> findByEmpIdOrderByEffectiveDateDesc(Long empId);
}
