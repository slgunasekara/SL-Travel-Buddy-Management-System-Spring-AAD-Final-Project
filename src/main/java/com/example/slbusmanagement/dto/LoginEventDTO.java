package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginEventDTO {
    private Long loginEventId;
    private Long userId;
    private String username;
    private String name;
    private String role;
    private String loginAt;
}
