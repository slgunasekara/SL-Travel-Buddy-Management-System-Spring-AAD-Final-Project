package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.TripExpenseDTO;
import com.example.slbusmanagement.entity.Trip;
import com.example.slbusmanagement.entity.TripExpense;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.TripExpenseRepository;
import com.example.slbusmanagement.repository.TripRepository;
import com.example.slbusmanagement.service.TripExpenseService;
import com.example.slbusmanagement.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class TripExpenseServiceImpl implements TripExpenseService {

    private final TripExpenseRepository tripExpenseRepository;
    private final TripRepository tripRepository;

    private Trip resolveTrip(Long tripId) {
        if (tripId == null) return null;
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private TripExpenseDTO toDto(TripExpense entity) {
        TripExpenseDTO dto = new TripExpenseDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setTripId(entity.getTrip() != null ? entity.getTrip().getTripId() : null);
        dto.setDate(DateUtil.formatDate(entity.getDate()));
        return dto;
    }

    @Override
    public List<TripExpenseDTO> getAll() {
        log.info("Get All TripExpense Method Executed....");
        return tripExpenseRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }

    @Override
    public TripExpenseDTO add(TripExpenseDTO dto) {
        log.info("Save TripExpense Method Executed....");
        TripExpense entity = new TripExpense();
        BeanUtils.copyProperties(dto, entity);

        entity.setTripExpId(null);
        entity.setTrip(resolveTrip(dto.getTripId()));
        entity.setDate(DateUtil.parseDate(dto.getDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        tripExpenseRepository.save(entity);
        log.info("TripExpense Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public TripExpenseDTO update(Long id, TripExpenseDTO dto) {
        log.info("Update TripExpense Method Executed....");
        TripExpense entity = tripExpenseRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        entity.setTrip(resolveTrip(dto.getTripId()));
        entity.setDate(DateUtil.parseDate(dto.getDate()));
        entity.setFuelAmount(dto.getFuelAmount());
        entity.setParkingAmount(dto.getParkingAmount());
        entity.setOtherAmount(dto.getOtherAmount());
        entity.setOtherDescription(dto.getOtherDescription());
        entity.setNotes(dto.getNotes());


        tripExpenseRepository.save(entity);
        log.info("TripExpense Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete TripExpense Method Executed....");
        TripExpense entity = tripExpenseRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
        entity.setStatus(RecordStatus.INACTIVE);
        tripExpenseRepository.save(entity);
        log.info("TripExpense Deleted (soft) Successfully....");
    }
}
