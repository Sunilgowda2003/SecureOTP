
package com.secureotp.service;

import com.secureotp.dto.AuthDtos.*;
import com.secureotp.entity.AppUser;
import com.secureotp.entity.OtpPurpose;
import com.secureotp.repository.AppUserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final AppUserRepository users;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
            AppUserRepository users,
            OtpService otpService,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService) {

        this.users = users;
        this.otpService = otpService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    // Registration: request OTP
    public MessageResponse requestRegistration(RegisterRequest request) {

        String email = normalize(request.email());

        AppUser user = users.findByEmailIgnoreCase(email).orElse(null);

        if (user != null && user.isEnabled()) {
            throw new IllegalArgumentException(
                    "An account with this email already exists.");
        }

        if (user == null) {
            user = new AppUser();
            user.setEmail(email);
        }

        user.setName(request.name().trim());
        user.setPasswordHash(
                passwordEncoder.encode(request.password()));
        user.setEnabled(false);

        users.save(user);

        String code = otpService.generate(email, OtpPurpose.REGISTER);

        emailService.sendOtp(
                email, code, "Account registration");

        return new MessageResponse(
                "If the registration request is eligible, a verification code has been sent.");
    }

    // Registration: verify OTP
    public MessageResponse verifyRegistration(VerifyOtpRequest request) {

        String email = normalize(request.email());

        if (!otpService.verify(
                email, OtpPurpose.REGISTER, request.code())) {

            throw new IllegalArgumentException(
                    "Invalid or expired verification code.");
        }

        AppUser user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid or expired verification code."));

        user.setEnabled(true);
        users.save(user);

        return new MessageResponse(
                "Registration completed successfully.");
    }

    // Login: request OTP
    public MessageResponse requestLogin(EmailRequest request) {

        String email = normalize(request.email());

        users.findByEmailIgnoreCase(email)
                .filter(AppUser::isEnabled)
                .ifPresent(user -> {

                    String code = otpService.generate(
                            email, OtpPurpose.LOGIN);

                    emailService.sendOtp(
                            email, code, "Login");
                });

        return new MessageResponse(
                "If an eligible account exists, a login code will be sent.");
    }

    // Login: verify OTP and create session
    @Transactional
    public LoginSession verifyLogin(VerifyOtpRequest request) {

        String email = normalize(request.email());

        if (!otpService.verify(
                email, OtpPurpose.LOGIN, request.code())) {

            throw new IllegalArgumentException(
                    "Invalid or expired verification code.");
        }

        // Initial lookup to identify the user
        AppUser existingUser = users.findByEmailIgnoreCase(email)
                .filter(AppUser::isEnabled)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid or expired verification code."));

        // Lock the user before creating a session
        AppUser user = users.findByIdForUpdate(existingUser.getId())
                .filter(AppUser::isEnabled)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid or expired verification code."));

        // Generate access JWT using the locked user
        String accessToken = jwtService.generate(user);

        // Create refresh token in the same transaction
        String refreshToken =
                refreshTokenService.createRefreshToken(user);

        return new LoginSession(
                accessToken,
                refreshToken);
    }

    // Forgot password: request OTP
    public MessageResponse requestPasswordReset(EmailRequest request) {

        String email = normalize(request.email());

        users.findByEmailIgnoreCase(email)
                .filter(AppUser::isEnabled)
                .ifPresent(user -> {

                    String code = otpService.generate(
                            email, OtpPurpose.PASSWORD_RESET);

                    emailService.sendOtp(
                            email, code, "Password reset");
                });

        return new MessageResponse(
                "If an eligible account exists, password reset instructions will be sent.");
    }

    // Reset password and invalidate existing sessions
    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {

        String email = normalize(request.email());

        // 1. Verify password reset OTP
        if (!otpService.verify(
                email,
                OtpPurpose.PASSWORD_RESET,
                request.code())) {

            throw new IllegalArgumentException(
                    "Invalid or expired verification code.");
        }

        // 2. Initial user lookup
        AppUser existingUser = users.findByEmailIgnoreCase(email)
                .filter(AppUser::isEnabled)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid or expired verification code."));

        // 3. Lock user row before changing credentials
        AppUser user = users.findByIdForUpdate(existingUser.getId())
                .filter(AppUser::isEnabled)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid or expired verification code."));

        // 4. Update password
        user.setPasswordHash(
                passwordEncoder.encode(request.newPassword()));

        // 5. Increment token version
        // Previously issued access JWTs become invalid
        user.setTokenVersion(
                Math.incrementExact(user.getTokenVersion()));

        // 6. Save updated user
        users.save(user);

        // 7. Revoke every refresh token for this user
        refreshTokenService.revokeAllUserTokens(user);

        return new MessageResponse(
                "Password updated successfully.");
    }

    // Normalize email consistently
    private String normalize(String email) {

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    "Email is required.");
        }

        return email.trim().toLowerCase(Locale.ROOT);
    }
}
