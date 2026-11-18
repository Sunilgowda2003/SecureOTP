
package com.secureotp.service;

import com.secureotp.entity.OtpChallenge;
import com.secureotp.entity.OtpPurpose;
import com.secureotp.repository.OtpChallengeRepository;
import com.secureotp.repository.OtpLockRepository;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class OtpService {

    private final OtpChallengeRepository challengeRepository;
    private final OtpLockRepository lockRepository;

    private final SecureRandom random = new SecureRandom();

    @Value("${app.otp.hmac-secret}")
    private String hmacSecret;

    @Value("${app.otp.expiry-minutes:5}")
    private long expiryMinutes;

    @Value("${app.otp.resend-seconds:60}")
    private long resendSeconds;

    @Value("${app.otp.max-attempts:5}")
    private int maxAttempts;

    public OtpService(
            OtpChallengeRepository challengeRepository,
            OtpLockRepository lockRepository) {

        this.challengeRepository = challengeRepository;
        this.lockRepository = lockRepository;
    }

    // Validate OTP configuration during application startup.
    @PostConstruct
    public void validateConfiguration() {

        if (hmacSecret == null ||
                hmacSecret.getBytes(StandardCharsets.UTF_8).length < 32) {

            throw new IllegalStateException(
                    "OTP HMAC secret must contain at least 32 bytes.");
        }

        if (expiryMinutes <= 0) {
            throw new IllegalStateException(
                    "OTP expiry must be greater than zero.");
        }

        if (resendSeconds < 0) {
            throw new IllegalStateException(
                    "OTP resend cooldown cannot be negative.");
        }

        if (maxAttempts <= 0) {
            throw new IllegalStateException(
                    "OTP maximum attempts must be greater than zero.");
        }

        try {
            Math.multiplyExact(expiryMinutes, 60L);
        } catch (ArithmeticException ex) {
            throw new IllegalStateException(
                    "OTP expiry configuration is too large.", ex);
        }
    }

    // Generate and store a new OTP.
    // AuthService is responsible for sending the email.
    @Transactional
    public String generate(String email, OtpPurpose purpose) {

        validatePurpose(purpose);

        String normalizedEmail = normalize(email);

        // Lock OTP operations for this email and purpose.
        acquireLock(normalizedEmail, purpose);

        Instant now = Instant.now();

        var previous = challengeRepository
                .findFirstByEmailAndPurposeOrderByCreatedAtDescIdDesc(
                        normalizedEmail, purpose);

        if (previous.isPresent()) {

            OtpChallenge old = previous.get();

            Instant resendAllowedAt = old.getCreatedAt()
                    .plusSeconds(resendSeconds);

            if (now.isBefore(resendAllowedAt)) {
                throw new IllegalStateException(
                        "Please wait before requesting another code.");
            }

            // Invalidate the previous OTP.
            old.setConsumed(true);
            challengeRepository.save(old);
        }

        // Generate a secure six-digit OTP.
        String code = String.format(
                Locale.ROOT,
                "%06d",
                random.nextInt(1_000_000));

        OtpChallenge challenge = new OtpChallenge();

        challenge.setEmail(normalizedEmail);
        challenge.setPurpose(purpose);

        // Store only the HMAC hash.
        challenge.setOtpHash(
                hash(normalizedEmail, purpose, code));

        challenge.setExpiresAt(
                now.plusSeconds(
                        Math.multiplyExact(expiryMinutes, 60L)));

        challengeRepository.save(challenge);

        return code;
    }

    // Verify OTP using database locking.
    @Transactional
    public boolean verify(
            String email,
            OtpPurpose purpose,
            String code) {

        validatePurpose(purpose);

        String normalizedEmail = normalize(email);

        // Lock OTP operations for this email and purpose.
        acquireLock(normalizedEmail, purpose);

        var optional = challengeRepository
                .findFirstByEmailAndPurposeOrderByCreatedAtDescIdDesc(
                        normalizedEmail, purpose);

        if (optional.isEmpty()) {
            return false;
        }

        OtpChallenge challenge = optional.get();

        // Prevent OTP replay.
        if (challenge.isConsumed()) {
            return false;
        }

        Instant now = Instant.now();

        // Reject expired OTPs.
        if (!now.isBefore(challenge.getExpiresAt())) {

            challenge.setConsumed(true);
            challengeRepository.save(challenge);

            return false;
        }

        // Enforce maximum verification attempts.
        if (challenge.getAttempts() >= maxAttempts) {
            return false;
        }

        // Count every verification attempt.
        challenge.setAttempts(
                Math.incrementExact(challenge.getAttempts()));

        String suppliedCode = isValidCode(code) ? code : "";

        String suppliedHash = hash(
                normalizedEmail,
                purpose,
                suppliedCode);

        // Compare hashes using constant-time comparison.
        boolean matches = MessageDigest.isEqual(
                challenge.getOtpHash().getBytes(StandardCharsets.UTF_8),
                suppliedHash.getBytes(StandardCharsets.UTF_8));

        // Consume OTP after successful verification.
        if (matches) {
            challenge.setConsumed(true);
        }

        challengeRepository.save(challenge);

        return matches;
    }

    // Validate OTP purpose.
    private void validatePurpose(OtpPurpose purpose) {

        if (purpose == null) {
            throw new IllegalArgumentException(
                    "OTP purpose is required.");
        }
    }

    // Validate six-digit OTP format.
    private boolean isValidCode(String code) {

        if (code == null || code.length() != 6) {
            return false;
        }

        for (int i = 0; i < code.length(); i++) {

            if (code.charAt(i) < '0' || code.charAt(i) > '9') {
                return false;
            }
        }

        return true;
    }

    // Normalize and validate email.
    private String normalize(String email) {

        if (email == null) {
            throw new IllegalArgumentException(
                    "Email address is required.");
        }

        String normalizedEmail = email.trim();

        if (normalizedEmail.isBlank() ||
                normalizedEmail.length() > 254) {

            throw new IllegalArgumentException(
                    "Invalid email address.");
        }

        return normalizedEmail.toLowerCase(Locale.ROOT);
    }

    // Create lock row if necessary and acquire its database lock.
    private void acquireLock(
            String email,
            OtpPurpose purpose) {

        lockRepository.insertIfAbsent(
                email,
                purpose.name());

        lockRepository.findForUpdate(email, purpose)
                .orElseThrow(() -> new IllegalStateException(
                        "Unable to acquire OTP database lock."));
    }

    // Generate HMAC-SHA256 hash.
    private String hash(
            String email,
            OtpPurpose purpose,
            String code) {

        try {

            Mac mac = Mac.getInstance("HmacSHA256");

            mac.init(new SecretKeySpec(
                    hmacSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"));

            String input = email
                    + ":" + purpose.name()
                    + ":" + code;

            byte[] hashBytes = mac.doFinal(
                    input.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hashBytes);

        } catch (Exception ex) {

            throw new IllegalStateException(
                    "OTP cryptographic operation failed.", ex);
        }
    }
}
