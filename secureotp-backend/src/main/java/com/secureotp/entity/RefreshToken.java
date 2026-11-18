
package com.secureotp.entity;

import jakarta.persistence.*;

import java.time.Instant;


@Entity
@Table(
    name = "refresh_tokens",
    indexes = {
        @Index(
            name = "idx_refresh_token_hash",
            columnList = "token_hash",
            unique = true
        ),
        @Index(
            name = "idx_refresh_user",
            columnList = "user_id"
        ),
        @Index(
            name = "idx_refresh_family",
            columnList = "family_id"
        )
    }
)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(
        name = "token_hash",
        nullable = false,
        unique = true,
        length = 64
    )
    private String tokenHash;

    @Column(name = "family_id", nullable = false, length = 36)
    private String familyId;

    @Column(name = "replaced_by_token_id")
    private Long replacedByTokenId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked", nullable = false)
    private boolean revoked = false;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private Instant createdAt = Instant.now();

    public RefreshToken() {
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public String getFamilyId() {
        return familyId;
    }

    public Long getReplacedByTokenId() {
        return replacedByTokenId;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isRevoked() {
        return revoked;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public void setFamilyId(String familyId) {
        this.familyId = familyId;
    }

    public void setReplacedByTokenId(Long replacedByTokenId) {
        this.replacedByTokenId = replacedByTokenId;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public void setRevoked(boolean revoked) {
        this.revoked = revoked;

        if (revoked && this.revokedAt == null) {
            this.revokedAt = Instant.now();
        }

        if (!revoked) {
            this.revokedAt = null;
        }
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
