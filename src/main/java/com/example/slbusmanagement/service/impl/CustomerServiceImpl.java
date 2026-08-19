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
        log.info("Get All Customer Method Executed....");

        return customerRepository.findAll().stream()
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .map(this::toDto).toList();

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
        log.info("Update Customer Method Executed....");
        Customer entity = customerRepository.findById(id)
                .filter(x -> x.getStatus() == RecordStatus.ACTIVE)
                .orElseThrow(() -> new CustomeException(404, "Customer not found with ID: " + id));

        entity.setName(dto.getName());
        entity.setContact(dto.getContact());
        entity.setNic(dto.getNic());
        entity.setEmail(dto.getEmail());
        entity.setAddress(dto.getAddress());
        entity.setNotes(dto.getNotes());
        entity.setClientTier(dto.getClientTier());
        entity.setAgreedRate(dto.getAgreedRate());
        entity.setBillingCycle(dto.getBillingCycle());
        entity.setCreatedBy(dto.getCreatedBy());
        entity.setCreatedAt(dto.getCreatedAt());

        customerRepository.save(entity);
        log.info("Customer Updated Successfully....");
        return toDto(entity);
    }

    @Override
    public void delete(Long id) {

    }
}
