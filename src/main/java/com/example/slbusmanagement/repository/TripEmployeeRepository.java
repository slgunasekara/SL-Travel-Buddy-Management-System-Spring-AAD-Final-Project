package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.TripEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripEmployeeRepository extends JpaRepository<TripEmployee, Long> {
}
