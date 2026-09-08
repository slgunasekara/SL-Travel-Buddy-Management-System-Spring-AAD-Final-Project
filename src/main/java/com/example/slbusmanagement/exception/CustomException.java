package com.example.slbusmanagement.exception;

import com.example.slbusmanagement.constant.ResponseMessage;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomException extends RuntimeException {

    private int status;
    private String message;


    public CustomException(int status) {
        super(ResponseMessage.forStatus(status));
        this.status = status;
        this.message = ResponseMessage.forStatus(status);
    }


    public CustomException(int status, String message) {
        super(message);
        this.status = status;
        this.message = message;
    }
}
