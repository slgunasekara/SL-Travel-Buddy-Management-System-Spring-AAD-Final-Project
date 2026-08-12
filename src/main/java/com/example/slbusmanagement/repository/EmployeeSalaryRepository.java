package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.EmployeeSalary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, Long> {
}
