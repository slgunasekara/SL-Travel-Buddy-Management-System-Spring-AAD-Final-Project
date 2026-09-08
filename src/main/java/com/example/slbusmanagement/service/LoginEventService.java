package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.LoginEventDTO;

import java.util.List;

public interface LoginEventService {

    List<LoginEventDTO> getRecentForRole(Long selfUserId, String selfRole);
}
