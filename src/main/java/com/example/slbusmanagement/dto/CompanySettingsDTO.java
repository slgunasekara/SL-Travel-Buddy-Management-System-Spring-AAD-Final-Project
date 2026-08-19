package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CompanySettingsDTO {
    private String companyName;
    private String address;
    private String phone;
    private String logoUrl;
}
