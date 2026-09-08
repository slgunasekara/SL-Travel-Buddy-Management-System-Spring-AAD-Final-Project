package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data @AllArgsConstructor @NoArgsConstructor
public class OtpResponseDTO {
    private boolean ok;
    private Long userId;
    private String userName;
    private String email;
}
