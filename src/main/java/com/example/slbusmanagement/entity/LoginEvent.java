package com.example.slbusmanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


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
