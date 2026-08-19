package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.UserDTO;
import com.example.slbusmanagement.entity.User;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.enumiration.UserRole;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.UserRepository;
import com.example.slbusmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private UserDTO toDto(User u) {
        // Password is intentionally never sent back to the client.
        return new UserDTO(u.getUserId(), u.getUsername(), null, u.getName(),
                u.getRole().name(), u.getContact(), u.getNic(), u.getEmail(), u.getCreatedAt());
    }


    @Override
    public List<UserDTO> getAll() {
        log.info("Get All Users Method Executed....");
        return userRepository.findAll().stream()
                .filter(u -> u.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }


    @Override
    public UserDTO add(UserDTO dto) {
        log.info("Save User Method Executed....");

        boolean dup = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == RecordStatus.ACTIVE)
                .anyMatch(u -> u.getUsername().equalsIgnoreCase(dto.getUsername()));
        if (dup) throw new CustomeException(400, "Username already exists!");

        User u = new User();
        u.setUserId(dto.getUserId());
        u.setUsername(dto.getUsername());
        u.setPassword(passwordEncoder.encode(dto.getPassword()));
        u.setName(dto.getName());
        u.setRole(UserRole.valueOf(dto.getRole()));
        u.setContact(dto.getContact());
        u.setNic(dto.getNic());
        u.setEmail(dto.getEmail());
        u.setCreatedAt(LocalDateTime.now().toString());
        u.setStatus(RecordStatus.ACTIVE);

        userRepository.save(u);
        log.info("User Saved Successfully....");
        return toDto(u);
    }

    @Override
    public UserDTO update(Long id, UserDTO dto) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }

}
