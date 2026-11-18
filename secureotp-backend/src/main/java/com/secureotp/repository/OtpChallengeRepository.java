
package com.secureotp.repository;

import com.secureotp.entity.OtpChallenge;
import com.secureotp.entity.OtpPurpose;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface OtpChallengeRepository
        extends JpaRepository<OtpChallenge, Long> {

    // Retrieve the latest OTP challenge with a write lock.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<OtpChallenge>
    findFirstByEmailAndPurposeOrderByCreatedAtDescIdDesc(
            String email,
            OtpPurpose purpose
    );
}
