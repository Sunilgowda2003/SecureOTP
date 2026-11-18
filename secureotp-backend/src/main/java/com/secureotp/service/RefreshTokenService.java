
package com.secureotp.service;

import com.secureotp.dto.AuthDtos.LoginSession;
import com.secureotp.entity.AppUser;
import com.secureotp.entity.RefreshToken;
import com.secureotp.repository.AppUserRepository;
import com.secureotp.repository.RefreshTokenRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final AppUserRepository appUserRepository;
    private final JwtService jwtService;
    private final TransactionTemplate transactionTemplate;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.jwt.refresh-expiry-days:30}")
    private long refreshExpiryDays;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            AppUserRepository appUserRepository,
            JwtService jwtService,
            PlatformTransactionManager transactionManager) {

        this.refreshTokenRepository = refreshTokenRepository;
        this.appUserRepository = appUserRepository;
        this.jwtService = jwtService;

        this.transactionTemplate =
                new TransactionTemplate(transactionManager);

        // Replay detection must commit independently.
        this.transactionTemplate.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW
        );
    }

    private record CreatedToken(
            RefreshToken entity,
            String rawValue
    ) {
    }

    private record RotationResult(
            LoginSession session,
            boolean replayDetected
    ) {
    }

    // Generate a cryptographically secure refresh token.
    private String generateRawToken() {

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }

    // Store only the SHA-256 hash of the refresh token.
    private String hashToken(String rawToken) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    rawToken.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (Exception ex) {

            throw new IllegalStateException(
                    "Unable to hash refresh token.",
                    ex
            );
        }
    }

    // Validate refresh-token expiry configuration.
    private long getExpirySeconds() {

        if (refreshExpiryDays <= 0) {
            throw new IllegalStateException(
                    "Refresh token expiry must be positive."
            );
        }

        return Math.multiplyExact(
                refreshExpiryDays,
                24L * 60 * 60
        );
    }

    // Create and persist a token within a family.
    private CreatedToken createToken(
            AppUser user,
            String familyId) {

        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException(
                    "A persisted user is required."
            );
        }

        if (!user.isEnabled()) {
            throw new IllegalArgumentException(
                    "User account is disabled."
            );
        }

        if (familyId == null || familyId.isBlank()) {
            throw new IllegalArgumentException(
                    "A valid refresh-token family is required."
            );
        }

        long expirySeconds = getExpirySeconds();

        String rawToken = generateRawToken();

        RefreshToken refreshToken = new RefreshToken();

        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashToken(rawToken));
        refreshToken.setFamilyId(familyId);

        refreshToken.setExpiresAt(
                Instant.now().plusSeconds(expirySeconds)
        );

        refreshToken.setRevoked(false);

        RefreshToken savedToken =
                refreshTokenRepository.saveAndFlush(refreshToken);

        return new CreatedToken(savedToken, rawToken);
    }

    // Create a new token family during login.
    // AuthService locks the user before calling this method.
    @Transactional
    public String createRefreshToken(AppUser user) {

        String familyId = UUID.randomUUID().toString();

        return createToken(user, familyId).rawValue();
    }

    // Rotate a refresh token.
    public LoginSession rotateRefreshToken(String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Refresh token is missing."
            );
        }

        String tokenHash = hashToken(rawToken);

        RotationResult result = transactionTemplate.execute(status -> {

            // 1. Find token without acquiring a write lock.
            RefreshToken initialToken = refreshTokenRepository
                    .findByTokenHash(tokenHash)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Invalid refresh token."
                    ));

            Long userId = initialToken.getUser().getId();

            // 2. Lock user first.
            AppUser user = appUserRepository
                    .findByIdForUpdate(userId)
                    .filter(AppUser::isEnabled)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Invalid or disabled user."
                    ));

            // 3. Lock refresh token second.
            RefreshToken oldToken = refreshTokenRepository
                    .findByTokenHashForUpdate(tokenHash)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Invalid refresh token."
                    ));

            // 4. Verify token ownership.
            if (!oldToken.getUser().getId().equals(user.getId())) {
                throw new IllegalArgumentException(
                        "Invalid refresh token."
                );
            }

            // 5. Detect reuse of a previously revoked token.
            if (oldToken.isRevoked()) {

                revokeTokenFamily(oldToken.getFamilyId());

                // Return normally so the family revocation commits.
                return new RotationResult(null, true);
            }

            // 6. Validate expiry and account status.
            if (oldToken.getExpiresAt() == null
                    || !oldToken.getExpiresAt().isAfter(Instant.now())) {

                throw new IllegalArgumentException(
                        "Refresh token has expired."
                );
            }

            String familyId = oldToken.getFamilyId();

            if (familyId == null || familyId.isBlank()) {
                throw new IllegalStateException(
                        "Refresh-token family information is missing."
                );
            }

            // 7. Create replacement in the same family.
            CreatedToken replacement = createToken(user, familyId);

            // 8. Revoke previous token and record replacement ID.
            oldToken.setRevoked(true);
            oldToken.setReplacedByTokenId(
                    replacement.entity().getId()
            );

            refreshTokenRepository.save(oldToken);

            // 9. Generate a new access JWT.
            String newAccessToken = jwtService.generate(user);

            LoginSession session = new LoginSession(
                    newAccessToken,
                    replacement.rawValue()
            );

            return new RotationResult(session, false);
        });

        if (result == null) {
            throw new IllegalStateException(
                    "Refresh-token rotation did not complete."
            );
        }

        // This exception occurs after the transaction commits.
        if (result.replayDetected()) {
            throw new IllegalArgumentException(
                    "Refresh token reuse detected. Please log in again."
            );
        }

        return result.session();
    }

    // Revoke every token belonging to one family.
    // The caller must already hold the associated user lock.
    private void revokeTokenFamily(String familyId) {

        if (familyId == null || familyId.isBlank()) {
            return;
        }

        List<RefreshToken> familyTokens =
                refreshTokenRepository.findAllByFamilyIdForUpdate(
                        familyId
                );

        for (RefreshToken token : familyTokens) {
            token.setRevoked(true);
        }

        refreshTokenRepository.saveAll(familyTokens);
    }

    // Global logout and immediate JWT invalidation.
    @Transactional
    public void revokeRefreshToken(String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        String tokenHash = hashToken(rawToken);

        // 1. Find token without locking.
        RefreshToken initialToken = refreshTokenRepository
                .findByTokenHash(tokenHash)
                .orElse(null);

        if (initialToken == null) {
            return;
        }

        Long userId = initialToken.getUser().getId();

        // 2. Lock user first.
        AppUser user = appUserRepository
                .findByIdForUpdate(userId)
                .orElse(null);

        if (user == null) {
            return;
        }

        // 3. Lock refresh token second.
        RefreshToken token = refreshTokenRepository
                .findByTokenHashForUpdate(tokenHash)
                .orElse(null);

        if (token == null) {
            return;
        }

        // 4. Verify ownership.
        if (!token.getUser().getId().equals(user.getId())) {
            return;
        }

        // 5. Retrieve all tokens for this user.
        List<RefreshToken> userTokens =
                refreshTokenRepository.findAllByUser(user);

        // 6. Avoid incrementing token version unnecessarily.
        boolean hasActiveTokens = userTokens.stream()
                .anyMatch(refreshToken -> !refreshToken.isRevoked());

        if (!hasActiveTokens) {
            return;
        }

        // 7. Increment token version.
        // This invalidates previously issued access JWTs.
        user.setTokenVersion(
                Math.incrementExact(user.getTokenVersion())
        );

        appUserRepository.save(user);

        // 8. Revoke every refresh token belonging to the user.
        for (RefreshToken refreshToken : userTokens) {
            refreshToken.setRevoked(true);
        }

        refreshTokenRepository.saveAll(userTokens);
    }

    // Revoke all refresh tokens belonging to a user.
    // Caller must hold the user lock and an active transaction.
    @Transactional
    public void revokeAllUserTokens(AppUser user) {

        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException(
                    "A persisted user is required."
            );
        }

        List<RefreshToken> tokens =
                refreshTokenRepository.findAllByUser(user);

        for (RefreshToken token : tokens) {
            token.setRevoked(true);
        }

        refreshTokenRepository.saveAll(tokens);
    }
}
