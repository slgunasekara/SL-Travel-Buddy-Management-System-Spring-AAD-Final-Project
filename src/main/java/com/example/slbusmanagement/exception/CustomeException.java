package com.example.slbusmanagement.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomeException extends RuntimeException {

    private int status;
    private String message;

}
