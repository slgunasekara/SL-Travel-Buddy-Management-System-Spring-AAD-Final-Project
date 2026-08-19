package com.example.slbusmanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Single-row table (id is always 1) — company letterhead shown on every
 *  printed receipt/report (print.js) and usable anywhere else branding is
 *  needed. Company-wide, not per-device, so it lives on the backend rather
 *  than in localStorage like the theme/idle-timeout preferences. */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class CompanySettings {

    @Id
    private Long id;

    private String companyName;

    private String address;

    private String phone;

    private String logoUrl;
}
