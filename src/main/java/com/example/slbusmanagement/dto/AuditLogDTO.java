package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuditLogDTO {
    private Long auditId;
    private String entityType;
    private String entityId;
    private String action;
    private String performedBy;
    private String performedAt;
}
