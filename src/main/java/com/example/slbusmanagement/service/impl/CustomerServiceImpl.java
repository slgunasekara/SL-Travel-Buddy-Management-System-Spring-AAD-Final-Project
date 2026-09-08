package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.CustomerDTO;
import com.example.slbusmanagement.entity.Customer;
import com.example.slbusmanagement.enumeration.RecordStatus;
import com.example.slbusmanagement.constant.ResponseCode;
import com.example.slbusmanagement.exception.CustomException;
import com.example.slbusmanagement.repository.CustomerRepository;
import com.example.slbusmanagement.service.CustomerService;
import com.example.slbusmanagement.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    private CustomerDTO toDto(Customer entity) {
        CustomerDTO dto = new CustomerDTO();
        BeanUtils.copyProperties(entity, dto);
        dto.setCreatedAt(DateUtil.formatDateTime(entity.getCreatedAt()));
        return dto;
    }

    @Override
    public List<CustomerDTO> getAll() {
        log.info("Get All Customer Method Executed....");

        return customerRepository.findAllByStatus(RecordStatus.ACTIVE).stream()
                .map(this::toDto).toList();
    }

    @Override
    public CustomerDTO add(CustomerDTO dto) {
        log.info("Save Customer Method Executed....");


        String nic = (dto.getNic() == null || dto.getNic().isBlank()) ? null : dto.getNic();
        if (nic != null) {
            boolean dup = !customerRepository.findByNicIgnoreCaseAndStatus(nic, RecordStatus.ACTIVE).isEmpty();
            if (dup) throw new CustomException(ResponseCode.CONFLICT, "A customer with this NIC already exists!");
        }

        Customer entity = new Customer();
        BeanUtils.copyProperties(dto, entity);

        entity.setCustomerId(null);
        entity.setNic(nic);
        entity.setStatus(RecordStatus.ACTIVE);
        entity.setCreatedAt(LocalDateTime.now());
        customerRepository.save(entity);
        log.info("Customer Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public CustomerDTO update(Long id, CustomerDTO dto) {
        log.info("Update Customer Method Executed....");
        Customer entity = customerRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));

        String nic = (dto.getNic() == null || dto.getNic().isBlank()) ? null : dto.getNic();
        if (nic != null) {
            boolean dup = !customerRepository.findByNicIgnoreCaseAndStatusExcludingId(nic, RecordStatus.ACTIVE, id).isEmpty();
            if (dup) throw new CustomException(ResponseCode.CONFLICT, "A customer with this NIC already exists!");
        }

        entity.setName(dto.getName());
        entity.setContact(dto.getContact());
        entity.setNic(nic);
        entity.setEmail(dto.getEmail());
        entity.setAddress(dto.getAddress());
        entity.setNotes(dto.getNotes());


        customerRepository.save(entity);
        log.info("Customer Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {
        log.info("Delete Customer Method Executed....");
        Customer entity = customerRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ResponseCode.NOT_FOUND));


        entity.setStatus(RecordStatus.INACTIVE);
        customerRepository.save(entity);
        log.info("Customer Deleted (soft) Successfully....");
    }
}
