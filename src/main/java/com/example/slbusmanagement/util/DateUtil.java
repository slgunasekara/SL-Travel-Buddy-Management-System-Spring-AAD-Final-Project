package com.example.slbusmanagement.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;


public final class DateUtil {

    private DateUtil() {}


    public static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new com.example.slbusmanagement.exception.CustomException(
                    400, "Invalid date format: '" + value + "' — expected YYYY-MM-DD.");
        }
    }

    public static String formatDate(LocalDate value) {
        return value != null ? value.toString() : null;
    }


    public static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e) {
            throw new com.example.slbusmanagement.exception.CustomException(
                    400, "Invalid date-time format: '" + value + "'.");
        }
    }

    public static String formatDateTime(LocalDateTime value) {
        return value != null ? value.toString() : null;
    }


    public static Instant parseInstant(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException e) {
            throw new com.example.slbusmanagement.exception.CustomException(
                    400, "Invalid instant format: '" + value + "'.");
        }
    }

    public static String formatInstant(Instant value) {
        return value != null ? value.toString() : null;
    }
}
