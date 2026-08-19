package com.example.slbusmanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** One row per successful login — powers the "X just logged in" toast that
 *  Owner/Manager users see, and the audit trail behind it. */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class LoginEvent {

    @Id
    private Long loginEventId;

    private Long userId;
    private String username;
    private String name;
    private String role;
    private String loginAt; // ISO instant string
}
