package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private Long userId;
    private String username;
    /** Plain-text on the way in (Manage Users form); never populated on the way out. */
    private String password;
    private String name;
    private String role;
    private String contact;
    private String nic;
    private String email;
    private String createdAt;
}
