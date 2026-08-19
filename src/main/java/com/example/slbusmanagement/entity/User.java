package com.example.slbusmanagement.entity;

import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.enumiration.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Mirrors the `users` table from db.js exactly (userId, username, password,
 *  name, role, contact, nic, email, createdAt). */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "app_user")
public class User {

    @Id
    private Long userId;

    @Column(unique = true, nullable = false)
    private String username;

    private String password;

    private String name;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    private String contact;

    private String nic;

    private String email;

    private String createdAt;

    /** Two-Factor Authentication — email OTP required at login when true.
     *  Self-service opt-in per user (Settings → Security). */
    private boolean twoFactorEnabled;

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}
