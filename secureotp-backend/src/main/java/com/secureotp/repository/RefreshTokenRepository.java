
package com.secureotp.repository;

import com.secureotp.entity.RefreshToken;
import com.secureotp.entity.AppUser;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    // Find token to identify its owner
    Optional<RefreshToken> findByTokenHash(String hash);

    // Lock refresh token after locking its associated user
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r
        FROM RefreshToken r
        WHERE r.tokenHash = :hash
        """)
    Optional<RefreshToken> findByTokenHashForUpdate(
            @Param("hash") String hash
    );

    // Retrieve all refresh tokens belonging to a user
    List<RefreshToken> findAllByUser(AppUser user);

    // Retrieve all tokens belonging to a refresh-token family
    List<RefreshToken> findAllByFamilyId(String familyId);

    // Lock all tokens belonging to a family
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT r
        FROM RefreshToken r
        WHERE r.familyId = :familyId
        ORDER BY r.id
        """)
    List<RefreshToken> findAllByFamilyIdForUpdate(
            @Param("familyId") String familyId
    );

    // Delete all refresh tokens belonging to a user
    void deleteAllByUser(AppUser user);
}
