
package com.secureotp.service;

import com.secureotp.entity.AppUser;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiry-minutes:15}")
    private long expiryMinutes;

    private SecretKey signingKey;

    // Validate JWT configuration during application startup.
    @PostConstruct
    public void validateConfiguration() {

        if (secret == null ||
                secret.getBytes(StandardCharsets.UTF_8).length < 32) {

            throw new IllegalStateException(
                    "JWT secret must contain at least 32 bytes.");
        }

        if (expiryMinutes <= 0) {
            throw new IllegalStateException(
                    "JWT expiry must be greater than zero.");
        }

        try {
            Math.multiplyExact(expiryMinutes, 60L);
        } catch (ArithmeticException ex) {
            throw new IllegalStateException(
                    "JWT expiry configuration is too large.", ex);
        }

        this.signingKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8));
    }

    // Generate a signed access JWT.
    public String generate(AppUser user) {

        if (user == null ||
                user.getId() == null ||
                user.getEmail() == null ||
                user.getEmail().isBlank()) {

            throw new IllegalArgumentException(
                    "Valid user details are required to generate JWT.");
        }

        if (user.getTokenVersion() < 0) {
            throw new IllegalArgumentException(
                    "Invalid user token version.");
        }

        Instant now = Instant.now();

        Instant expiration = now.plusSeconds(
                Math.multiplyExact(expiryMinutes, 60L));

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("ver", user.getTokenVersion())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(signingKey)
                .compact();
    }

    // Extract email from a verified JWT.
    public String extractEmail(String token) {

        return extractAllClaims(token).getSubject();
    }

    // Extract token version from JWT.
    public Integer extractTokenVersion(String token) {

        Object version = extractAllClaims(token).get("ver");

        if (!(version instanceof Number number)) {
            return null;
        }

        long value = number.longValue();

        if (value < 0 || value > Integer.MAX_VALUE ||
                number.doubleValue() != (double) value) {
            return null;
        }

        return (int) value;
    }

    // Verify JWT signature and extract claims.
    public Claims extractAllClaims(String token) {

        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException(
                    "JWT token is required.");
        }

        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Validate JWT signature, email, expiration and token version.
    public boolean isTokenValid(String token, String email) {

        try {

            if (email == null || email.isBlank()) {
                return false;
            }

            Claims claims = extractAllClaims(token);

            Integer version = extractTokenVersion(token);

            return claims.getSubject() != null
                    && claims.getSubject().equals(email)
                    && claims.getExpiration() != null
                    && claims.getExpiration().after(new Date())
                    && version != null;

        } catch (JwtException | IllegalArgumentException ex) {

            return false;
        }
    }

    // Extract expiration date.
    public Date extractExpiration(String token) {

        return extractAllClaims(token).getExpiration();
    }
}
