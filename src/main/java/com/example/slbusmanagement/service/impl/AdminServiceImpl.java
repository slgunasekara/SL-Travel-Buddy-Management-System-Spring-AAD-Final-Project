package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.service.AdminService;
import com.example.slbusmanagement.service.BackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final BackupService backupService;

    @Override
    public String backupNow() {
        return backupService.backupNow();
    }
}
