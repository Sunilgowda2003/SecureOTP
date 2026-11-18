
package com.secureotp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String sender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String email, String code, String purpose) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(sender);
        message.setTo(email);
        message.setSubject("Your SecureOTP verification code");

        message.setText(
            "Your SecureOTP code is: " + code + "\n\n" +
            "Purpose: " + purpose + "\n" +
            "This code expires in 5 minutes and can only be used once.\n" +
            "Do not share this code with anyone.\n" +
            "If you did not request this code, you can ignore this email."
        );

        System.out.println("Sending OTP email to: " + email);

        mailSender.send(message);

        System.out.println("OTP email sent successfully to: " + email);
    }
}
