package com.startup1.oceansense.Exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice 
// Reminder to myself: this class applies globally to ALL controllers.
// Whenever a controller throws an exception, this handler can catch it.

public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    // This means: catch ANY exception thrown in the backend.
    public ResponseEntity<String> handleException(Exception ex) {

        ex.printStackTrace();
        // Note to self: printing the stack trace helps me debug during development.

        // Instead of exposing a massive error, this returns a clean message to the client.
        return new ResponseEntity<>(
                "ERROR: " + ex.getMessage(), 
                HttpStatus.INTERNAL_SERVER_ERROR // returns HTTP 500
        );
        // Reminder: HTTP 500 = server error.
        // This ensures consistent error formatting for the frontend.
    }
}