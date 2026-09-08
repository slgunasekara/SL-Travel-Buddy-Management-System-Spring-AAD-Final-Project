package com.example.slbusmanagement.util;

import com.example.slbusmanagement.exception.CustomException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Issue 17/28: DateUtil is the single conversion point between the
 * entity-side java.time types (introduced to fix Issue 28) and the
 * DTO/API-side plain strings. These tests lock down the two behaviours
 * every entity/service relies on: null-safety (empty input is "no date",
 * never a crash) and round-tripping (parse then format gives back exactly
 * what was fed in, so nothing silently reformats a stored value).
 */
class DateUtilTest {

    @Test
    void parseDate_returnsNull_forNullAndBlank() {
        assertNull(DateUtil.parseDate(null));
        assertNull(DateUtil.parseDate(""));
        assertNull(DateUtil.parseDate("   "));
    }

    @Test
    void parseDate_parsesValidIsoDate() {
        assertEquals(LocalDate.of(2026, 8, 21), DateUtil.parseDate("2026-08-21"));
    }

    @Test
    void parseDate_throwsCustomException_forInvalidFormat() {
        CustomException ex = assertThrows(CustomException.class, () -> DateUtil.parseDate("21/08/2026"));
        assertEquals(400, ex.getStatus());
    }

    @Test
    void formatDate_roundTripsWithParseDate() {
        String original = "2026-01-31";
        assertEquals(original, DateUtil.formatDate(DateUtil.parseDate(original)));
    }

    @Test
    void formatDate_returnsNull_forNullInput() {
        assertNull(DateUtil.formatDate(null));
    }

    @Test
    void parseDateTime_roundTrips() {
        String original = LocalDateTime.of(2026, 8, 21, 14, 30, 0).toString();
        LocalDateTime parsed = DateUtil.parseDateTime(original);
        assertEquals(original, DateUtil.formatDateTime(parsed));
    }

    @Test
    void parseDateTime_throwsCustomException_forInvalidFormat() {
        assertThrows(CustomException.class, () -> DateUtil.parseDateTime("not-a-timestamp"));
    }

    @Test
    void parseInstant_roundTrips() {
        String original = Instant.parse("2026-08-21T10:15:30Z").toString();
        Instant parsed = DateUtil.parseInstant(original);
        assertEquals(original, DateUtil.formatInstant(parsed));
    }

    @Test
    void parseInstant_returnsNull_forBlank() {
        assertNull(DateUtil.parseInstant(""));
        assertNull(DateUtil.parseInstant(null));
    }
}
