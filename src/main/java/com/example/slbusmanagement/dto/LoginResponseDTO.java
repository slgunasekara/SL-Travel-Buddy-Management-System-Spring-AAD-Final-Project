package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class LoginResponseDTO {
    private Long userId;
    private String username;
    private String name;
    private String role;
    private String contact;
    private String nic;
    private String email;
    private String createdAt;
    private String token;
}
