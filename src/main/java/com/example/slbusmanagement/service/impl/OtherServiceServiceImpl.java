package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.OtherServiceDTO;
import com.example.slbusmanagement.entity.Bus;
import com.example.slbusmanagement.entity.OtherService;
import com.example.slbusmanagement.entity.Trip;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.BusRepository;
import com.example.slbusmanagement.repository.OtherServiceRepository;
import com.example.slbusmanagement.repository.TripRepository;
import com.example.slbusmanagement.service.OtherServiceService;
import com.example.slbusmanagement.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class OtherServiceServiceImpl implements OtherServiceService {

    private final OtherServiceRepository otherServiceRepository;
    private final TripRepository tripRepository;
    private final BusRepository busRepository;

    private Trip resolveTrip(Long tripId) {
        if (tripId == null) return null;
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private Bus resolveBus(Long busId) {
        if (busId == null) return null;
        return busRepository.findById(busId)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));
    }

    private OtherServiceDTO toDto(OtherService entity) {
        OtherServiceDTO dto = new OtherServiceDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setTripId(entity.getTrip() != null ? entity.getTrip().getTripId() : null);
        dto.setBusId(entity.getBus() != null ? entity.getBus().getBusId() : null);
        dto.setDate(DateUtil.formatDate(entity.getDate()));
        return dto;
    }

    @Override
    public List<OtherServiceDTO> getAll() {
        log.info("Get All OtherService Method Executed....");

        return otherServiceRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();
    }

    @Override
    public OtherServiceDTO add(OtherServiceDTO dto) {
        log.info("Save OtherService Method Executed....");
        OtherService entity = new OtherService();
        BeanUtils.copyProperties(dto, entity);

        entity.setServiceId(null);
        entity.setTrip(resolveTrip(dto.getTripId()));
        entity.setBus(resolveBus(dto.getBusId()));
        entity.setDate(resolveServiceDate(entity.getTrip(), dto.getDate()));
        entity.setStatus(RecordStatus.ACTIVE);
        otherServiceRepository.save(entity);
        log.info("OtherService Saved Successfully....");
        return toDto(entity);
    }


    private LocalDate resolveServiceDate(Trip trip, String fallbackDateStr) {
        if (trip != null && trip.getTripDate() != null) return trip.getTripDate();
        return DateUtil.parseDate(fallbackDateStr);
    }

    @Override
    public OtherServiceDTO update(Long id, OtherServiceDTO dto) {
        log.info("Update OtherService Method Executed....");
        OtherService entity = otherServiceRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        entity.setTrip(resolveTrip(dto.getTripId()));
        entity.setBus(resolveBus(dto.getBusId()));
        entity.setServiceName(dto.getServiceName());
        entity.setCost(dto.getCost());
        entity.setDescription(dto.getDescription());
        entity.setDate(resolveServiceDate(entity.getTrip(), dto.getDate()));


        otherServiceRepository.save(entity);
        log.info("OtherService Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete OtherService Method Executed....");
        OtherService entity = otherServiceRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));


        entity.setStatus(RecordStatus.INACTIVE);
        otherServiceRepository.save(entity);
        log.info("OtherService Deleted (soft) Successfully....");
    }
}
