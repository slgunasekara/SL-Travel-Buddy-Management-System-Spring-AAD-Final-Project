package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
}
