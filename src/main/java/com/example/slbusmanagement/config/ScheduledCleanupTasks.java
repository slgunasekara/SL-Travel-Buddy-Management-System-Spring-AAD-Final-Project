package com.example.slbusmanagement.config;

import com.example.slbusmanagement.entity.LoginEvent;
import com.example.slbusmanagement.entity.PasswordResetOtp;
import com.example.slbusmanagement.repository.LoginEventRepository;
import com.example.slbusmanagement.repository.PasswordResetOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;


@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledCleanupTasks {

    private final LoginEventRepository loginEventRepository;
    private final PasswordResetOtpRepository otpRepository;

    @Scheduled(cron = "0 0 3 * * *")
    public void pruneOldLoginEvents() {
        Instant cutoff = Instant.now().minusSeconds(90L * 24 * 60 * 60);
        List<LoginEvent> stale = loginEventRepository.findAllOlderThan(cutoff);
        if (!stale.isEmpty()) {
            loginEventRepository.deleteAll(stale);
            log.info("Pruned {} login-event record(s) older than 90 days.", stale.size());
        }
    }


    @Scheduled(cron = "0 0 * * * *")
    public void pruneOldOtps() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(1);
        List<PasswordResetOtp> stale = otpRepository.findAllOlderThan(cutoff);
        if (!stale.isEmpty()) {
            otpRepository.deleteAll(stale);
            log.info("Pruned {} expired password-reset OTP record(s).", stale.size());
        }
    }
}
