
package com.secureotp.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "otp_locks",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_otp_lock_email_purpose",
            columnNames = {"email", "purpose"}
        )
    }
)
public class OtpLock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 254)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OtpPurpose purpose;

    protected OtpLock() {
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public OtpPurpose getPurpose() {
        return purpose;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPurpose(OtpPurpose purpose) {
        this.purpose = purpose;
    }
}
