package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class ResetPasswordRequestDTO {
    private Long userId;
    private String email;
    private String code;
    private String newPassword;
}
