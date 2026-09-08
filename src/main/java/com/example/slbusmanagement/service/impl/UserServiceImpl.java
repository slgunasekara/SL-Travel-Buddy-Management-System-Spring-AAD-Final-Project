package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.UserDTO;
import com.example.slbusmanagement.entity.User;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.enumeration.UserRole;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.UserRepository;
import com.example.slbusmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private UserDTO toDto(User u) {

        return new UserDTO(u.getUserId(), u.getUsername(), null, u.getName(),
                u.getRole().name(), u.getContact(), u.getNic(), u.getEmail(),
                com.example.slbusmanagement.util.DateUtil.formatDateTime(u.getCreatedAt()));
    }

    @Override
    public List<UserDTO> getAll() {
        log.info("Get All Users Method Executed....");

        return userRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .map(this::toDto).toList();
    }

    @Override
    public UserDTO add(UserDTO dto) {
        log.info("Save User Method Executed....");

        boolean dup = !userRepository.findByUsernameIgnoreCaseAndStatus(dto.getUsername(), RecordStatus.ACTIVE).isEmpty();
        if (dup) throw new CustomException(ResponseCode.CONFLICT, "Username already exists!");

        User u = new User();

        u.setUsername(dto.getUsername());
        u.setPassword(passwordEncoder.encode(dto.getPassword()));
        u.setName(dto.getName());
        u.setRole(UserRole.valueOf(dto.getRole()));
        u.setContact(dto.getContact());
        u.setNic(dto.getNic());
        u.setEmail(dto.getEmail());
        u.setCreatedAt(LocalDateTime.now());
        u.setStatus(RecordStatus.ACTIVE);

        userRepository.save(u);
        log.info("User Saved Successfully....");
        return toDto(u);
    }

    @Override
    public UserDTO update(Long id, UserDTO dto) {
        log.info("Update User Method Executed....");

        User u = userRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        boolean dup = !userRepository.findByUsernameIgnoreCaseAndStatusExcludingId(dto.getUsername(), RecordStatus.ACTIVE, id).isEmpty();
        if (dup) throw new CustomException(ResponseCode.CONFLICT, "Username already exists!");


        u.setUsername(dto.getUsername());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            u.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        u.setName(dto.getName());
        u.setContact(dto.getContact());
        u.setNic(dto.getNic());
        u.setEmail(dto.getEmail());

        userRepository.save(u);
        log.info("User Updated Successfully....");
        return toDto(u);
    }

    @Override
    public UserDTO updateStatus(Long id, String status) {
        log.info("Update User Status Method Executed....");
        User u = userRepository.findById(id)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
        u.setStatus(RecordStatus.valueOf(status));
        userRepository.save(u);
        log.info("User Status Updated Successfully....");
        return toDto(u);
    }

    @Override
    public UserDTO updateRole(Long id, String role) {
        log.info("Update User Role Method Executed....");
        User u = userRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
        u.setRole(UserRole.valueOf(role));
        userRepository.save(u);
        log.info("User Role Updated Successfully....");
        return toDto(u);
    }

    @Override
    public void delete(Long id, Long selfUserId) {
        log.info("Delete User Method Executed....");

        if (id.equals(selfUserId)) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "You cannot delete your own account while logged in.");
        }
        User u = userRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
        u.setStatus(RecordStatus.INACTIVE);
        userRepository.save(u);
        log.info("User Deleted (soft) Successfully....");
    }
}
