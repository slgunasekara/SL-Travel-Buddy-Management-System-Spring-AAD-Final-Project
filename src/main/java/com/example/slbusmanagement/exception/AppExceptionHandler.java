package com.example.slbusmanagement.exception;

import com.example.slbusmanagement.constant.CommonResponse;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.constant.ResponseMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.stream.Collectors;

@ControllerAdvice
@Slf4j
public class AppExceptionHandler extends ResponseEntityExceptionHandler {


    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        log.warn("Validation failed: {}", message);
        return new ResponseEntity<>(new CommonResponse(ResponseCode.BAD_REQUEST, message), HttpStatus.BAD_REQUEST);
    }


    @Override
    protected ResponseEntity<Object> handleTypeMismatch(
            TypeMismatchException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String message = "Invalid value for '" + ex.getPropertyName() + "': " + ex.getValue();
        log.warn("Type mismatch: {}", message);
        return new ResponseEntity<>(new CommonResponse(ResponseCode.BAD_REQUEST, message), HttpStatus.BAD_REQUEST);
    }


    @Override
    protected ResponseEntity<Object> handleMissingServletRequestParameter(
            MissingServletRequestParameterException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String message = "Missing required parameter: " + ex.getParameterName();
        log.warn(message);
        return new ResponseEntity<>(new CommonResponse(ResponseCode.BAD_REQUEST, message), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(value = {CustomException.class})
    public ResponseEntity<CommonResponse> handleCustomException(CustomException ex, WebRequest request) {
        log.warn("Handled business exception: {}", ex.getMessage());
        HttpStatusCode status = resolveStatus(ex.getStatus());
        return new ResponseEntity<>(new CommonResponse(ex.getStatus(), ex.getMessage()), status);
    }

    @ExceptionHandler(value = {AccessDeniedException.class})
    public ResponseEntity<CommonResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        return new ResponseEntity<>(new CommonResponse(ResponseCode.FORBIDDEN, ResponseMessage.forStatus(ResponseCode.FORBIDDEN)), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(value = {AuthenticationException.class})
    public ResponseEntity<CommonResponse> handleAuthentication(AuthenticationException ex, WebRequest request) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return new ResponseEntity<>(new CommonResponse(ResponseCode.UNAUTHORIZED, ResponseMessage.forStatus(ResponseCode.UNAUTHORIZED)), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(value = {Exception.class})
    public ResponseEntity<CommonResponse> handleServerException(Exception ex, WebRequest request) {
        log.error("Unexpected server error", ex);
        return new ResponseEntity<>(new CommonResponse(ResponseCode.INTERNAL_SERVER_ERROR, ResponseMessage.forStatus(ResponseCode.INTERNAL_SERVER_ERROR)), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private HttpStatusCode resolveStatus(int status) {
        try {
            return HttpStatusCode.valueOf(status);
        } catch (Exception e) {
            return HttpStatus.BAD_REQUEST;
        }
    }
}
