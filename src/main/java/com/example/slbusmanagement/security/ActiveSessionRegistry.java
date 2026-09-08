package com.example.slbusmanagement.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;


@Component
public class ActiveSessionRegistry {

    public static final long ACTIVE_WINDOW_MINUTES = 15;

    public record SessionInfo(Long userId, String username, String name, String role, Instant lastSeen) {}

    private final ConcurrentHashMap<Long, SessionInfo> sessions = new ConcurrentHashMap<>();

    public void touch(Long userId, String username, String name, String role) {
        sessions.put(userId, new SessionInfo(userId, username, name, role, Instant.now()));
    }

    public boolean isOwnerActive() {
        Instant cutoff = Instant.now().minusSeconds(ACTIVE_WINDOW_MINUTES * 60);
        return sessions.values().stream()
                .anyMatch(s -> "Owner".equals(s.role()) && s.lastSeen().isAfter(cutoff));
    }
}
