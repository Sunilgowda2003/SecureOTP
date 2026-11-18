
package com.secureotp.config;

import com.secureotp.security.IpRateLimitFilter;
import com.secureotp.security.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    IpRateLimitFilter ipRateLimitFilter() {
        return new IpRateLimitFilter();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            IpRateLimitFilter ipRateLimitFilter
    ) throws Exception {

        CookieCsrfTokenRepository csrfRepository =
                CookieCsrfTokenRepository.withHttpOnlyFalse();

        csrfRepository.setCookiePath("/");

        CsrfTokenRequestAttributeHandler csrfHandler =
                new CsrfTokenRequestAttributeHandler();

        http

            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfRepository)
                .csrfTokenRequestHandler(csrfHandler)
                .ignoringRequestMatchers(
                    "/api/auth/register/**",
                    "/api/auth/login/**",
                    "/api/auth/password/**"
                )
            )

            .cors(Customizer.withDefaults())

            .sessionManagement(session -> session
                .sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/user/**").authenticated()
                .anyRequest().denyAll()
            )

            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(
                    (request, response, exception) ->
                        response.sendError(
                            HttpServletResponse.SC_UNAUTHORIZED
                        )
                )
            )

            // IP-based rate limiting
            .addFilterBefore(
                ipRateLimitFilter,
                UsernamePasswordAuthenticationFilter.class
            )

            // JWT authentication
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(frontendUrl));

        config.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            )
        );

        config.setAllowedHeaders(
            List.of(
                "Authorization",
                "Content-Type",
                "X-XSRF-TOKEN"
            )
        );

        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
