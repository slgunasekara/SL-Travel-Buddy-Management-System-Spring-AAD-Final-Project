package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.OtherService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtherServiceRepository extends JpaRepository<OtherService, Long> {
}
