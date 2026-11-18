
package com.secureotp.security;

import com.secureotp.entity.AppUser;
import com.secureotp.repository.AppUserRepository;
import com.secureotp.service.JwtService;

import io.jsonwebtoken.JwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AppUserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            AppUserRepository userRepository) {

        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {

            String email = jwtService.extractEmail(token);
            Integer tokenVersion = jwtService.extractTokenVersion(token);

            if (email == null || tokenVersion == null) {
                SecurityContextHolder.clearContext();
                filterChain.doFilter(request, response);
                return;
            }

            if (SecurityContextHolder.getContext().getAuthentication() == null) {

                Optional<AppUser> optionalUser =
                        userRepository.findByEmailIgnoreCase(email);

                if (optionalUser.isPresent()) {

                    AppUser appUser = optionalUser.get();

                    boolean validToken =
                            appUser.isEnabled()
                            && jwtService.isTokenValid(token, email)
                            && tokenVersion == appUser.getTokenVersion();

                    if (validToken) {

                        var userDetails = User
                                .withUsername(appUser.getEmail())
                                .password(appUser.getPasswordHash())
                                .authorities("ROLE_USER")
                                .disabled(!appUser.isEnabled())
                                .build();

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );

                        authentication.setDetails(
                                new WebAuthenticationDetailsSource()
                                        .buildDetails(request)
                        );

                        SecurityContextHolder.getContext()
                                .setAuthentication(authentication);
                    }
                }
            }

        } catch (JwtException | IllegalArgumentException ex) {

            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
