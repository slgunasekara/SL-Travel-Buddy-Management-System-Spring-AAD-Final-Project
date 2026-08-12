package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.LoginEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginEventRepository extends JpaRepository<LoginEvent, Long> {
}
