package com.example.slbusmanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One row per create/update/delete anywhere in the app — written
 *  automatically by AuditLogAspect, never by hand. Auto-increment ID
 *  (unlike the rest of the app's client-assigned IDs) since this is
 *  written purely server-side. */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long auditId;

    private String entityType;

    private String entityId;

    private String action; // CREATE / UPDATE / DELETE

    private String performedBy; // username from the JWT

    private String performedAt;
}
