package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.Event;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e WHERE e.status = :status")
    List<Event> findAllByStatus(@Param("status") RecordStatus status);


    @Query("SELECT e FROM Event e WHERE e.status = :status AND e.eventDate BETWEEN :from AND :to")
    List<Event> findByStatusAndEventDateBetween(@Param("status") RecordStatus status,
                                                 @Param("from") LocalDate from,
                                                 @Param("to") LocalDate to);


    boolean existsByBus_BusIdAndStatus(Long busId, RecordStatus status);
}
