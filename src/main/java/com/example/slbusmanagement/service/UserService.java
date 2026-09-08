package com.example.slbusmanagement.service;

import com.example.slbusmanagement.dto.UserDTO;

import java.util.List;

public interface UserService {
    List<UserDTO> getAll();
    UserDTO add(UserDTO dto);
    UserDTO update(Long id, UserDTO dto);
    UserDTO updateStatus(Long id, String status);
    UserDTO updateRole(Long id, String role);
    void delete(Long id, Long selfUserId);
}
