package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;


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
            if (recipient.getUserId().equals(loggedInUser.getUserId())) continue; // don't notify the person about their own login
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
    public void sendDigestEmail(java.util.List<User> recipients, String subject, String body) {
        if (!enabled) {
            log.info("Digest email skipped (app.mail.enabled=false): {}", subject);
            return;
        }
        if (fromAddress == null || fromAddress.isBlank() || fromAddress.startsWith("REPLACE_WITH")) {
            log.warn("Digest email skipped — app.mail.from / spring.mail.username still has the placeholder value.");
            return;
        }
        if (recipients == null || recipients.isEmpty()) return;

        for (User recipient : recipients) {
            if (recipient.getEmail() == null || recipient.getEmail().isBlank()) continue;
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromAddress);
                message.setTo(recipient.getEmail());
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                log.info("Digest email ({}) sent to {}", subject, recipient.getEmail());
            } catch (Exception ex) {
                log.warn("Failed to send digest email to {}: {}", recipient.getEmail(), ex.getMessage());
            }
        }
    }
}
