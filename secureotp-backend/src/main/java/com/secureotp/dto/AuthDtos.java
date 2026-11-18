
package com.secureotp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 12, max = 72) String password) {}

    public record EmailRequest(
            @NotBlank @Email @Size(max = 254) String email) {}

    public record VerifyOtpRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = "\\d{6}") String code) {}

    public record ResetPasswordRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = "\\d{6}") String code,
            @NotBlank @Size(min = 12, max = 72) String newPassword) {}

    public record MessageResponse(String message) {}

    // Public response: never contains the refresh token.
    public record LoginResponse(
            String message,
            String accessToken,
            String tokenType) {}

    // Internal result used between AuthService and AuthController.
    public record LoginSession(
            String accessToken,
            String refreshToken) {}
}
