
package com.secureotp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class IpRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 10 * 60 * 1000L;

    private static final int OTP_REQUEST_LIMIT = 5;
    private static final int OTP_VERIFY_LIMIT = 10;

    private static final int MAX_TRACKED_KEYS = 100_000;

    private final ConcurrentHashMap<String, Window> windows =
            new ConcurrentHashMap<>();

    private final AtomicLong cleanupCounter = new AtomicLong();

    private static class Window {
        private final long startTime;
        private int count;

        private Window(long startTime) {
            this.startTime = startTime;
            this.count = 1;
        }
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getServletPath();

        int limit;
        String category;

        switch (path) {

            case "/api/auth/register/request-otp":
            case "/api/auth/login/request-otp":
            case "/api/auth/password/forgot":
                limit = OTP_REQUEST_LIMIT;
                category = "OTP_REQUEST";
                break;

            case "/api/auth/register/verify":
            case "/api/auth/login/verify":
            case "/api/auth/password/reset":
                limit = OTP_VERIFY_LIMIT;
                category = "OTP_VERIFY";
                break;

            default:
                filterChain.doFilter(request, response);
                return;
        }

        String clientIp = request.getRemoteAddr();

        if (clientIp == null || clientIp.isBlank()) {
            clientIp = "UNKNOWN";
        }

        String key = category + ":" + clientIp;

        long now = System.currentTimeMillis();

        cleanupExpiredWindows(now);

        if (!allowRequest(key, limit, now)) {

            response.setStatus(429);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", "600");

            response.getWriter().write(
                    "{\"message\":\"Too many requests. Please try again later.\"}"
            );

            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean allowRequest(
            String key,
            int limit,
            long now
    ) {

        Window window = windows.compute(key, (k, current) -> {

            if (current == null
                    || now - current.startTime >= WINDOW_MILLIS) {
                return new Window(now);
            }

            synchronized (current) {
                current.count++;
            }

            return current;
        });

        synchronized (window) {
            if (window.count > limit) {
                return false;
            }
        }

        return true;
    }

    private void cleanupExpiredWindows(long now) {

        if (cleanupCounter.incrementAndGet() % 100 != 0
                && windows.size() <= MAX_TRACKED_KEYS) {
            return;
        }

        windows.entrySet().removeIf(entry -> {
            Window window = entry.getValue();

            return now - window.startTime >= WINDOW_MILLIS;
        });
    }
}
