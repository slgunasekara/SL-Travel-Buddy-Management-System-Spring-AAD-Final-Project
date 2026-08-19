package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.BusSaleRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusSaleRecordRepository extends JpaRepository<BusSaleRecord, Long> {
}
