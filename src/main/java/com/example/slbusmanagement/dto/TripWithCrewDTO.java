package com.example.slbusmanagement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripWithCrewDTO {

    @Valid
    private TripDTO trip;

    @NotEmpty(message = "At least one crew member is required")
    @Valid
    private List<TripEmployeeDTO> crew;
}
