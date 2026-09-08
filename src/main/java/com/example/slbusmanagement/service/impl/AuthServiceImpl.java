package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.*;
import com.example.slbusmanagement.entity.LoginEvent;
import com.example.slbusmanagement.entity.PasswordResetOtp;
import com.example.slbusmanagement.entity.User;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.LoginEventRepository;
import com.example.slbusmanagement.repository.PasswordResetOtpRepository;
import com.example.slbusmanagement.repository.UserRepository;
import com.example.slbusmanagement.security.ActiveSessionRegistry;
import com.example.slbusmanagement.security.JwtUtil;
import com.example.slbusmanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;


@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final LoginEventRepository loginEventRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final ActiveSessionRegistry activeSessionRegistry;
    private final EmailService emailService;

    private Optional<User> findByUsername(String username) {
        return userRepository.findAll().stream()
                .filter(u -> u.getStatus() == com.example.slbusmanagement.enumeration.RecordStatus.ACTIVE)
                .filter(u -> u.getUsername().equalsIgnoreCase(username))
                .findFirst();
    }

    private Optional<User> findByEmail(String email) {
        return userRepository.findAll().stream()
                .filter(u -> u.getStatus() == com.example.slbusmanagement.enumeration.RecordStatus.ACTIVE)
                .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email))
                .findFirst();
    }

    @Override
    public LoginResponseDTO login(LoginRequestDTO request) {
        log.info("Login Method Executed....");
        User user = findByUsername(request.getUsername())
                .orElseThrow(() -> new CustomException(ResponseCode.UNAUTHORIZED, "Invalid username or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ResponseCode.UNAUTHORIZED, "Invalid username or password.");
        }

        String token = jwtUtil.generateToken(user);


        activeSessionRegistry.touch(user.getUserId(), user.getUsername(), user.getName(), user.getRole().name());
        recordLoginEvent(user);
        notifyOwnerByEmail(user);

        return new LoginResponseDTO(user.getUserId(), user.getUsername(), user.getName(),
                user.getRole().name(), user.getContact(), user.getNic(), user.getEmail(),
                com.example.slbusmanagement.util.DateUtil.formatDateTime(user.getCreatedAt()), token);
    }


    private void notifyOwnerByEmail(User loggedInUser) {
        List<User> recipients = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == com.example.slbusmanagement.enumeration.RecordStatus.ACTIVE)
                .filter(u -> u.getRole() == com.example.slbusmanagement.enumeration.UserRole.Owner)
                .toList();
        emailService.sendLoginNotification(loggedInUser, recipients);
    }

    private void recordLoginEvent(User user) {

        LoginEvent event = new LoginEvent();
        event.setUser(user);
        event.setUsername(user.getUsername());
        event.setName(user.getName());
        event.setRole(user.getRole());
        event.setLoginAt(Instant.now());
        loginEventRepository.save(event);
    }

    @Override
    public OtpResponseDTO requestOtp(OtpRequestDTO request) {
        log.info("Request OTP Method Executed....");
        Optional<User> userOpt = findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return new OtpResponseDTO(false, null, null, null);
        }
        User user = userOpt.get();

        String otp = String.valueOf(100000 + new Random().nextInt(900000));
        LocalDateTime now = LocalDateTime.now();


        PasswordResetOtp rec = new PasswordResetOtp();
        rec.setUser(user);
        rec.setOtpCode(otp);
        rec.setEmail(user.getEmail());
        rec.setCreatedAt(now);
        rec.setExpiresAt(now.plusMinutes(10));
        rec.setUsed(false);
        otpRepository.save(rec);


        emailService.sendOtpEmail(user.getEmail(), user.getName(), otp);

        return new OtpResponseDTO(true, user.getUserId(), user.getName(), user.getEmail());
    }

    @Override
    public OtpVerifyResponseDTO verifyOtp(OtpVerifyRequestDTO request) {
        log.info("Verify OTP Method Executed....");
        LocalDateTime now = LocalDateTime.now();
        Optional<PasswordResetOtp> match = otpRepository.findValidByCode(request.getCode(), now).stream()
                .filter(o -> o.getEmail().equalsIgnoreCase(request.getEmail()))
                .reduce((first, second) -> second); // most recent match, like [...].reverse().find(...)

        if (match.isEmpty()) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "Invalid or expired code. Please try again.");
        }
        Long matchedUserId = match.get().getUser() != null ? match.get().getUser().getUserId() : null;
        return new OtpVerifyResponseDTO(matchedUserId);
    }

    @Override
    public void resetPassword(ResetPasswordRequestDTO request) {
        log.info("Reset Password Method Executed....");


        LocalDateTime now = LocalDateTime.now();
        PasswordResetOtp validOtp = otpRepository.findValidByCode(request.getCode(), now).stream()
                .filter(o -> o.getEmail() != null && o.getEmail().equalsIgnoreCase(request.getEmail()))
                .filter(o -> o.getUser() != null && o.getUser().getUserId().equals(request.getUserId()))
                .reduce((first, second) -> second) // most recent match
                .orElseThrow(() -> new CustomException(ResponseCode.BAD_REQUEST, "Invalid or expired code. Please request a new one."));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        validOtp.setUsed(true);
        otpRepository.save(validOtp);
    }

    @Override
    public void changePassword(String username, ChangePasswordRequestDTO request) {
        log.info("Change Password Method Executed....");
        User user = findByUsername(username)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "Current password is incorrect.");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new CustomException(ResponseCode.BAD_REQUEST, "New password must be at least 6 characters.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
