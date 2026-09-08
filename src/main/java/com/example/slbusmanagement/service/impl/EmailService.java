package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.time.ZonedDateTime;


@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.enabled:true}")
    private boolean enabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendLoginNotification(User loggedInUser, java.util.List<User> recipients) {
        if (!enabled) {
            log.info("Login notification email skipped (app.mail.enabled=false).");
            return;
        }
        if (fromAddress == null || fromAddress.isBlank() || fromAddress.startsWith("REPLACE_WITH")) {
            log.warn("Login notification email skipped — app.mail.from / spring.mail.username still has the placeholder value. Set real SMTP credentials in application.properties to enable this.");
            return;
        }
        if (recipients == null || recipients.isEmpty()) return;

        String when = ZonedDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
        String subject = "SL Travel Buddy — " + loggedInUser.getName() + " (" + loggedInUser.getRole() + ") just signed in";
        String body = loggedInUser.getName() + " (" + loggedInUser.getRole() + ", username: " + loggedInUser.getUsername() + ") "
                + "signed in to SL Travel Buddy at " + when + ".\n\n"
                + "If this wasn't expected, please check with them or reset their password from Manage Users.\n\n"
                + "— SL Travel Buddy";

        for (User recipient : recipients) {
            if (recipient.getEmail() == null || recipient.getEmail().isBlank()) continue;
            if (recipient.getUserId().equals(loggedInUser.getUserId()))
                continue; // don't notify the person about their own login
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromAddress);
                message.setTo(recipient.getEmail());
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                log.info("Login notification email sent to {}", recipient.getEmail());
            } catch (Exception ex) {
                log.warn("Failed to send login notification email to {}: {}", recipient.getEmail(), ex.getMessage());
            }
        }
    }


    @Async
    public void sendOtpEmail(String toEmail, String toName, String otpCode) {
        if (!enabled || fromAddress == null || fromAddress.isBlank() || fromAddress.startsWith("REPLACE_WITH")) {
            log.warn("OTP email delivery isn't configured (app.mail.enabled / app.mail.from) — code for {} is: {}", toEmail, otpCode);
            return;
        }
        if (toEmail == null || toEmail.isBlank()) return;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject("SL Travel Buddy — Password Reset Code");
            message.setText("Hi " + (toName != null ? toName : "there") + ",\n\n"
                    + "Your password reset code is: " + otpCode + "\n\n"
                    + "This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.\n\n"
                    + "— SL Travel Buddy");
            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);
        } catch (Exception ex) {
            log.warn("Failed to send OTP email to {}: {}", toEmail, ex.getMessage());
        }
    }
}
