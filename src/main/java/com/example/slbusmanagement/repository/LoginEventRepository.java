package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.LoginEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LoginEventRepository extends JpaRepository<LoginEvent, Long> {


    @Query("SELECT e FROM LoginEvent e WHERE e.loginAt >= :cutoff " +
           "AND (e.user IS NULL OR e.user.userId <> :selfUserId) " +
           "ORDER BY e.loginAt DESC")
    List<LoginEvent> findRecentExcludingUser(@Param("cutoff") Instant cutoff, @Param("selfUserId") Long selfUserId);


    @Query("SELECT e FROM LoginEvent e WHERE e.loginAt < :cutoff")
    List<LoginEvent> findAllOlderThan(@Param("cutoff") Instant cutoff);
}
