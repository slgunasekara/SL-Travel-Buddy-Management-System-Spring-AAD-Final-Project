package com.example.slbusmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RecycleBinItemDTO {
    private String entityType;
    private String entityId;
    private String repoBean; // internal — needed to look the record back up to restore it
}
