
package com.secureotp.controller;

import com.secureotp.dto.AuthDtos.*;
import com.secureotp.service.AuthService;
import com.secureotp.service.RefreshTokenService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookie;

    @Value("${app.cookie.same-site:Lax}")
    private String sameSite;

    @Value("${app.jwt.refresh-expiry-days:30}")
    private long refreshExpiryDays;

    public AuthController(
            AuthService authService,
            RefreshTokenService refreshTokenService) {

        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
    }

    // ==============================
    // REGISTRATION
    // ==============================

    @PostMapping("/register/request-otp")
    public MessageResponse register(
            @Valid @RequestBody RegisterRequest request) {

        return authService.requestRegistration(request);
    }

    @PostMapping("/register/verify")
    public MessageResponse verifyRegistration(
            @Valid @RequestBody VerifyOtpRequest request) {

        return authService.verifyRegistration(request);
    }

    // ==============================
    // LOGIN OTP
    // ==============================

    @PostMapping("/login/request-otp")
    public MessageResponse requestLogin(
            @Valid @RequestBody EmailRequest request) {

        return authService.requestLogin(request);
    }

    // ==============================
    // LOGIN VERIFICATION
    // ==============================

    @PostMapping("/login/verify")
    public ResponseEntity<LoginResponse> verifyLogin(
            @Valid @RequestBody VerifyOtpRequest request) {

        LoginSession session = authService.verifyLogin(request);

        ResponseCookie cookie =
                createRefreshCookie(session.refreshToken());

        LoginResponse response = new LoginResponse(
                "Login successful",
                session.accessToken(),
                "Bearer"
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    // ==============================
    // REFRESH ACCESS TOKEN
    // ==============================

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @CookieValue(
                    name = "refreshToken",
                    required = false
            ) String refreshToken) {

        try {

            LoginSession session =
                    refreshTokenService.rotateRefreshToken(refreshToken);

            ResponseCookie cookie =
                    createRefreshCookie(session.refreshToken());

            LoginResponse response = new LoginResponse(
                    "Token refreshed successfully",
                    session.accessToken(),
                    "Bearer"
            );

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);

        } catch (IllegalArgumentException ex) {

            ResponseCookie cookie = createRefreshCookie("");

            LoginResponse response = new LoginResponse(
                    "Your session has expired. Please log in again.",
                    null,
                    null
            );

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(response);
        }
    }

    // ==============================
    // LOGOUT
    // ==============================


@PostMapping("/logout")
public ResponseEntity<MessageResponse> logout(
        @CookieValue(
                name = "refreshToken",
                required = false
        ) String refreshToken) {

    ResponseCookie cookie = createRefreshCookie("");

    if (refreshToken == null || refreshToken.isBlank()) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new MessageResponse(
                        "Refresh token missing. Please log in again."
                ));
    }

    refreshTokenService.revokeRefreshToken(refreshToken);

    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(new MessageResponse(
                    "Logged out successfully."
            ));
}


    // ==============================
    // CSRF TOKEN
    // ==============================

    @GetMapping("/csrf")
    public ResponseEntity<Map<String, String>> csrf(
            CsrfToken csrfToken) {

        return ResponseEntity.ok(
                Map.of("token", csrfToken.getToken())
        );
    }

    // ==============================
    // FORGOT PASSWORD
    // ==============================

    @PostMapping("/password/forgot")
    public MessageResponse forgotPassword(
            @Valid @RequestBody EmailRequest request) {

        return authService.requestPasswordReset(request);
    }

    // ==============================
    // RESET PASSWORD
    // ==============================

    @PostMapping("/password/reset")
    public MessageResponse resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        return authService.resetPassword(request);
    }

    // ==============================
    // REFRESH COOKIE HELPER
    // ==============================

    private ResponseCookie createRefreshCookie(String token) {

        Duration maxAge =
                (token == null || token.isEmpty())
                        ? Duration.ZERO
                        : Duration.ofDays(refreshExpiryDays);

        return ResponseCookie.from(
                        "refreshToken",
                        token == null ? "" : token
                )
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/api/auth")
                .maxAge(maxAge)
                .build();
    }
}
