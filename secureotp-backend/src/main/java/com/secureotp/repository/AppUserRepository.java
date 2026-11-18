
package com.secureotp.repository;

import com.secureotp.entity.AppUser;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface AppUserRepository
        extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    // Retrieve and lock a user row for session operations.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT u
        FROM AppUser u
        WHERE u.id = :userId
        """)
    Optional<AppUser> findByIdForUpdate(
            @Param("userId") Long userId
    );
}
