package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.EmployeeSalary;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, Long> {

    @Query("SELECT s FROM EmployeeSalary s WHERE s.status = :status")
    List<EmployeeSalary> findAllByStatus(@Param("status") RecordStatus status);


    @Query("SELECT s FROM EmployeeSalary s WHERE s.status = :status AND s.date BETWEEN :from AND :to")
    List<EmployeeSalary> findByStatusAndDateBetween(@Param("status") RecordStatus status,
                                                     @Param("from") LocalDate from,
                                                     @Param("to") LocalDate to);
}
