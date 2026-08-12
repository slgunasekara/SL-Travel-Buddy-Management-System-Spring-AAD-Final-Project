package com.example.slbusmanagement.entity;

import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.enumiration.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


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

    @Enumerated(EnumType.STRING)
    private RecordStatus status = RecordStatus.ACTIVE;

}
