package com.secureotp.exception;

import com.secureotp.dto.AuthDtos.MessageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.mail.MailException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MessageResponse> handleBadRequest(
            IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(new MessageResponse(ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<MessageResponse> handleState(
            IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new MessageResponse(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponse> handleValidation(
            MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest()
                .body(new MessageResponse(
                        "Invalid request. Check the submitted fields."));
    }

    @ExceptionHandler(MailException.class)
    public ResponseEntity<MessageResponse> handleMail(MailException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new MessageResponse(
                        "Email delivery is temporarily unavailable."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse(
                        "An unexpected error occurred."));
    }
}