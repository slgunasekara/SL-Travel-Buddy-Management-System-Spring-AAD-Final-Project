package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.TripExpense;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripExpenseRepository extends JpaRepository<TripExpense, Long> {

    @Query("SELECT e FROM TripExpense e WHERE e.status = :status")
    List<TripExpense> findAllByStatus(@Param("status") RecordStatus status);
}
