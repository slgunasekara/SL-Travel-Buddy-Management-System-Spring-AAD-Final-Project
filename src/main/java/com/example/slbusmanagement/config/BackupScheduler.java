package com.example.slbusmanagement.config;

import com.example.slbusmanagement.service.BackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
@Slf4j
public class BackupScheduler {

    private final BackupService backupService;

    @Scheduled(cron = "0 0 2 * * *")
    public void runNightlyBackup() {
        try {
            String fileName = backupService.backupNow();
            log.info("Nightly auto-backup completed: {}", fileName);
        } catch (Exception e) {
            log.error("Nightly auto-backup FAILED", e);
        }
    }
}
