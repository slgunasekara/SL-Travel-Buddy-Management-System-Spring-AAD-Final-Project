package com.example.slbusmanagement.service.impl;

import com.example.slbusmanagement.dto.CustomerDTO;
import com.example.slbusmanagement.entity.Customer;
import com.example.slbusmanagement.enumiration.RecordStatus;
import com.example.slbusmanagement.exception.CustomeException;
import com.example.slbusmanagement.repository.CustomerRepository;
import com.example.slbusmanagement.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    private CustomerDTO toDto(Customer entity) {
        CustomerDTO dto = new CustomerDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }


    @Override
    public List<CustomerDTO> getAll() {
        return List.of();
    }

    @Override
    public CustomerDTO add(CustomerDTO dto) {
        log.info("Save Customer Method Executed....");
        Customer entity = new Customer();
        BeanUtils.copyProperties(dto, entity);
        entity.setStatus(RecordStatus.ACTIVE);
        customerRepository.save(entity);
        log.info("Customer Saved Successfully....");
        return toDto(entity);
    }

    @Override
    public CustomerDTO update(Long id, CustomerDTO dto) {
        return null;
    }

    @Override
    public void delete(Long id) {

    }
}
