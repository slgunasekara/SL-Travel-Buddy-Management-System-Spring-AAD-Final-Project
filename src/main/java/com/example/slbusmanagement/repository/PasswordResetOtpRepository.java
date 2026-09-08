package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {


    @Query("SELECT o FROM PasswordResetOtp o WHERE o.otpCode = :code AND o.isUsed = false " +
           "AND o.expiresAt > :now ORDER BY o.createdAt DESC")
    List<PasswordResetOtp> findValidByCode(@Param("code") String code, @Param("now") LocalDateTime now);

    @Query("SELECT o FROM PasswordResetOtp o WHERE o.createdAt < :cutoff")
    List<PasswordResetOtp> findAllOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
