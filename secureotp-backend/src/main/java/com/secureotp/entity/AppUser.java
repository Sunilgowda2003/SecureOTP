
package com.secureotp.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "app_users",
    uniqueConstraints = @UniqueConstraint(columnNames = "email")
)
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean enabled = false;

    // Used to invalidate previously issued access tokens
    @Column(name = "token_version", nullable = false)
    private int tokenVersion = 0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AppUser() {}

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public void setTokenVersion(int tokenVersion) {
        this.tokenVersion = tokenVersion;
    }
}
