package com.example.slbusmanagement.exception;

import com.example.slbusmanagement.contant.CommonResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@ControllerAdvice
public class AppExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(value = {CustomeException.class})
    public ResponseEntity<CommonResponse> handleCustomException(CustomeException ex, WebRequest request) {
        HttpStatusCode status = resolveStatus(ex.getStatus());
        return new ResponseEntity<>(new CommonResponse(ex.getStatus(), ex.getMessage()), status);
    }

    @ExceptionHandler(value = {AccessDeniedException.class})
    public ResponseEntity<CommonResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        return new ResponseEntity<>(new CommonResponse(403, "You do not have permission to perform this action"), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(value = {AuthenticationException.class})
    public ResponseEntity<CommonResponse> handleAuthentication(AuthenticationException ex, WebRequest request) {
        return new ResponseEntity<>(new CommonResponse(401, "Authentication required"), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(value = {Exception.class})
    public ResponseEntity<CommonResponse> handleServerException(Exception ex, WebRequest request) {
        ex.printStackTrace();
        return new ResponseEntity<>(new CommonResponse(500, "UNEXPECTED_ERROR"), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private HttpStatusCode resolveStatus(int status) {
        try {
            return HttpStatusCode.valueOf(status);
        } catch (Exception e) {
            return HttpStatus.BAD_REQUEST;
        }
    }
}
