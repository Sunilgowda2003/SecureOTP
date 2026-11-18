package com.secureotp.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "otp_challenges",
       indexes = @Index(name = "idx_otp_email_purpose",
                         columnList = "email,purpose"))
public class OtpChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 254)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OtpPurpose purpose;

    @Column(nullable = false, length = 64)
    private String otpHash;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(nullable = false)
    private boolean consumed = false;

    public OtpChallenge() {}

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public OtpPurpose getPurpose() { return purpose; }
    public String getOtpHash() { return otpHash; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public int getAttempts() { return attempts; }
    public boolean isConsumed() { return consumed; }

    public void setEmail(String email) { this.email = email; }
    public void setPurpose(OtpPurpose purpose) { this.purpose = purpose; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public void setConsumed(boolean consumed) { this.consumed = consumed; }
}