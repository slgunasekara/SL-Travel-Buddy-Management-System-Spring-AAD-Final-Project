package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.UpdatePrice;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface UpdatePriceRepository extends JpaRepository<UpdatePrice, Long> {


    @Query("SELECT p FROM UpdatePrice p WHERE p.status = :status " +
           "AND p.changeDate BETWEEN :from AND :to ORDER BY p.changeDate DESC")
    List<UpdatePrice> findByStatusAndChangeDateBetween(@Param("status") RecordStatus status,
                                                         @Param("from") LocalDate from,
                                                         @Param("to") LocalDate to);
}
