package com.example.slbusmanagement.util;

import java.util.List;


public class IdGenerator {
    public static Long next(List<Long> existingIds) {
        long max = 0L;
        for (Long id : existingIds) {
            if (id != null && id > max) max = id;
        }
        return max + 1;
    }
}
