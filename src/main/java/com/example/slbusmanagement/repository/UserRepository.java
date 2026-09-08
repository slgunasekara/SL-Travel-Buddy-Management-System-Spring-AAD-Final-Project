package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.User;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {


    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:username) AND u.status = :status")
    List<User> findByUsernameIgnoreCaseAndStatus(@Param("username") String username, @Param("status") RecordStatus status);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:username) AND u.status = :status AND u.userId <> :excludeId")
    List<User> findByUsernameIgnoreCaseAndStatusExcludingId(@Param("username") String username, @Param("status") RecordStatus status, @Param("excludeId") Long excludeId);

    @Query("SELECT u FROM User u WHERE u.status = :status")
    List<User> findAllByStatus(@Param("status") RecordStatus status);
}
