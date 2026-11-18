
package com.secureotp.repository;

import com.secureotp.entity.OtpLock;
import com.secureotp.entity.OtpPurpose;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface OtpLockRepository
        extends JpaRepository<OtpLock, Long> {

    // Create a lock row only if it does not already exist.
    @Modifying
    @Transactional
    @Query(
        value = """
            INSERT IGNORE INTO otp_locks (email, purpose)
            VALUES (:email, :purpose)
            """,
        nativeQuery = true
    )
    int insertIfAbsent(
            @Param("email") String email,
            @Param("purpose") String purpose
    );

    // Acquire an exclusive database lock for the OTP operation.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT l
        FROM OtpLock l
        WHERE l.email = :email
        AND l.purpose = :purpose
        """)
    Optional<OtpLock> findForUpdate(
            @Param("email") String email,
            @Param("purpose") OtpPurpose purpose
    );
}
