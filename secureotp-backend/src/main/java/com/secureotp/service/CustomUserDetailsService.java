
package com.secureotp.service;

import com.secureotp.entity.AppUser;
import com.secureotp.repository.AppUserRepository;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final AppUserRepository userRepository;

    public CustomUserDetailsService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + email
                        )
                );

        return User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .disabled(!user.isEnabled())
                .authorities("ROLE_USER")
                .build();
    }
}
