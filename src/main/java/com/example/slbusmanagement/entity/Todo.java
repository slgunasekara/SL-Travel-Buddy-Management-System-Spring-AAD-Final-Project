package com.example.slbusmanagement.entity;

import com.example.slbusmanagement.enumiration.RecordStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Internal To-Do List — Owner assigns a task to any user (typically a
 *  Manager), that user tracks it through to completion. Soft-deleted like
 *  everything else (status=INACTIVE), separate from todoStatus (the
 *  task's own PENDING/IN_PROGRESS/COMPLETED workflow state). */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Todo {

    @Id
    private Long todoId;

    private Long assignedByUserId;

    private Long assignedToUserId;

    // Denormalized display names — a Manager's browser doesn't have the
    // full Users table loaded (that's Owner-only, see db.js bootstrap()),
    // so the assigner/assignee names are stored directly rather than
    // requiring every viewer to resolve IDs through a table they can't see.
    private String assignedByName;

    private String assignedToName;

    private String title;

    private String description;

    private String dueDate;

    private String todoStatus; // PENDING / IN_PROGRESS / COMPLETED

    private Long createdBy;

    private String createdAt;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;
}
