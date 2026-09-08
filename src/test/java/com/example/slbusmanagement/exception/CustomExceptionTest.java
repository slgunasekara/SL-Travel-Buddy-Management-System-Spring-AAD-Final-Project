package com.example.slbusmanagement.exception;

import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.constant.ResponseMessage;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Issue 31: locks down the status-code-driven exception scheme — the
 * single-arg constructor must auto-fill a generic-but-meaningful message
 * from ResponseCode, the two-arg constructor must keep a caller's exact
 * custom message untouched, and OPERATION_SUCCESS/OPERATION_FAILURE must
 * never drift from 0/1 (the acceptance check the issue itself specifies).
 */
class CustomExceptionTest {

    @Test
    void successAndFailureCodes_areByteForByteUnchanged() {
        assertEquals(0, ResponseCode.OPERATION_SUCCESS);
        assertEquals(1, ResponseCode.OPERATION_FAILURE);
    }

    @Test
    void singleArgConstructor_autoFillsGenericMessage() {
        CustomException ex = new CustomException(ResponseCode.NOT_FOUND);
        assertEquals(ResponseCode.NOT_FOUND, ex.getStatus());
        assertEquals(ResponseMessage.forStatus(ResponseCode.NOT_FOUND), ex.getMessage());
        assertNotEquals(ResponseMessage.FAILED_MESSAGE, ex.getMessage(),
                "NOT_FOUND has its own mapped message — it should never fall back to the generic FAILED_MESSAGE.");
    }

    @Test
    void twoArgConstructor_keepsExactCustomMessage() {
        CustomException ex = new CustomException(ResponseCode.CONFLICT, "Username already exists!");
        assertEquals(ResponseCode.CONFLICT, ex.getStatus());
        assertEquals("Username already exists!", ex.getMessage());
    }

    @Test
    void forStatus_fallsBackToFailedMessage_forUnmappedCode() {
        assertEquals(ResponseMessage.FAILED_MESSAGE, ResponseMessage.forStatus(-1));
    }

    @Test
    void forStatus_returnsDistinctMessages_forEachStandardCode() {
        // Not exhaustive, but catches the copy-paste mistake of two codes
        // silently sharing one message.
        assertNotEquals(ResponseMessage.forStatus(ResponseCode.BAD_REQUEST), ResponseMessage.forStatus(ResponseCode.NOT_FOUND));
        assertNotEquals(ResponseMessage.forStatus(ResponseCode.UNAUTHORIZED), ResponseMessage.forStatus(ResponseCode.FORBIDDEN));
    }
}
