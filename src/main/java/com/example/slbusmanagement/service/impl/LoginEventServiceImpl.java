package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.LoginEventDTO;
import com.example.slbusmanagement.entity.LoginEvent;
import com.example.slbusmanagement.repository.LoginEventRepository;
import com.example.slbusmanagement.service.LoginEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;


@Service
@Slf4j
@RequiredArgsConstructor
public class LoginEventServiceImpl implements LoginEventService {

    private static final long WINDOW_SECONDS = 30;

    private final LoginEventRepository loginEventRepository;

    @Override
    public List<LoginEventDTO> getRecentForRole(Long selfUserId, String selfRole) {
        if (!"Owner".equals(selfRole) && !"Manager".equals(selfRole)) {
            return List.of();
        }

        log.info("Get Recent Login Events Method Executed....");
        Instant cutoff = Instant.now().minusSeconds(WINDOW_SECONDS);
        return loginEventRepository.findRecentExcludingUser(cutoff, selfUserId).stream()
                .map(this::toDto)
                .toList();
    }

    private LoginEventDTO toDto(LoginEvent e) {
        LoginEventDTO dto = new LoginEventDTO();
        BeanUtils.copyProperties(e, dto);
        dto.setUserId(e.getUser() != null ? e.getUser().getUserId() : null);
        dto.setRole(e.getRole() != null ? e.getRole().name() : null);
        dto.setLoginAt(com.example.slbusmanagement.util.DateUtil.formatInstant(e.getLoginAt()));
        return dto;
    }
}
