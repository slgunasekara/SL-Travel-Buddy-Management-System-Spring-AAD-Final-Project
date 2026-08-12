package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.TripExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripExpenseRepository extends JpaRepository<TripExpense, Long> {
}
