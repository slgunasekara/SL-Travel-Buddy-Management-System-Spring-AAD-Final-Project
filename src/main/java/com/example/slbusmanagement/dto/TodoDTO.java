package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TodoDTO {
    private Long todoId;
    private Long assignedByUserId;
    private Long assignedToUserId;
    private String assignedByName;
    private String assignedToName;
    private String title;
    private String description;
    private String dueDate;
    private String todoStatus;
    private Long createdBy;
    private String createdAt;
}
