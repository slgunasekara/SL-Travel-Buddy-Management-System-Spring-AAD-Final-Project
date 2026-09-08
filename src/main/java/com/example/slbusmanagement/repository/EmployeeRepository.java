package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.Employee;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {


    @Query("SELECT e FROM Employee e WHERE LOWER(e.nicNo) = LOWER(:nicNo) AND e.status = :status")
    List<Employee> findByNicNoIgnoreCaseAndStatus(@Param("nicNo") String nicNo, @Param("status") RecordStatus status);

    @Query("SELECT e FROM Employee e WHERE LOWER(e.nicNo) = LOWER(:nicNo) AND e.status = :status AND e.empId <> :excludeId")
    List<Employee> findByNicNoIgnoreCaseAndStatusExcludingId(@Param("nicNo") String nicNo, @Param("status") RecordStatus status, @Param("excludeId") Long excludeId);

    @Query("SELECT e FROM Employee e WHERE e.status = :status")
    List<Employee> findAllByStatus(@Param("status") RecordStatus status);
}
