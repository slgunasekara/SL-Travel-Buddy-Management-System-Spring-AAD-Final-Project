package com.example.slbusmanagement.constant;

import java.util.Map;

public class ResponseMessage {
    public static String SUCCESS_MESSAGE = "Operation Successful";
    public static String FAILED_MESSAGE = "Failed";


    private static final Map<Integer, String> DEFAULT_MESSAGES = Map.of(
            ResponseCode.BAD_REQUEST, "The request could not be understood or was missing required data.",
            ResponseCode.UNAUTHORIZED, "You need to log in to do that.",
            ResponseCode.FORBIDDEN, "You do not have permission to perform this action.",
            ResponseCode.NOT_FOUND, "The requested item could not be found.",
            ResponseCode.CONFLICT, "This already exists.",
            ResponseCode.UNPROCESSABLE_ENTITY, "The request could not be processed as submitted.",
            ResponseCode.INTERNAL_SERVER_ERROR, "Something went wrong on our end. Please try again."
    );

    public static String forStatus(int status) {
        return DEFAULT_MESSAGES.getOrDefault(status, FAILED_MESSAGE);
    }
}
