package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.UpdatePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UpdatePriceRepository extends JpaRepository<UpdatePrice, Long> {
}
