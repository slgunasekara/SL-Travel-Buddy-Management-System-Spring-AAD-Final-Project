package com.example.slbusmanagement.security;

import com.example.slbusmanagement.contant.CommonResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;
    private final ActiveSessionRegistry activeSessionRegistry;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7); // Remove "Bearer "
            String username = jwtUtil.extractUsername(token);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.validateToken(token, userDetails)) {
                    Long userId = jwtUtil.extractUserId(token);
                    java.time.Instant issuedAt = jwtUtil.extractIssuedAt(token) == null ? null : jwtUtil.extractIssuedAt(token).toInstant();
                    if (userId != null && activeSessionRegistry.isRevoked(userId, issuedAt)) {
                        handleJwtException(response, 401, "This session was ended remotely. Please log in again.");
                        return;
                    }

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    // Mark this user as "currently active" so the Owner-presence
                    // login gate and login notifications stay up to date.
                    String role = jwtUtil.extractRole(token);
                    String name = jwtUtil.extractName(token);
                    if (userId != null) {
                        activeSessionRegistry.touch(userId, username, name, role);
                    }
                }
            }

            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException ex) {
            handleJwtException(response, 401, "Token expired");
        } catch (SignatureException ex) {
            handleJwtException(response, 401, "Invalid token signature");
        } catch (MalformedJwtException ex) {
            handleJwtException(response, 401, "Invalid token format");
        } catch (Exception ex) {
            handleJwtException(response, 500, "Authentication failed");
        }
    }

    private void handleJwtException(HttpServletResponse response, int code, String message) throws IOException {
        response.setStatus(code);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        CommonResponse errorResponse = new CommonResponse(code, message);
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}
