package com.example.slbusmanagement.repository;

import com.example.slbusmanagement.entity.Customer;
import com.example.slbusmanagement.enumeration.RecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {


    @Query("SELECT c FROM Customer c WHERE LOWER(c.nic) = LOWER(:nic) AND c.status = :status")
    List<Customer> findByNicIgnoreCaseAndStatus(@Param("nic") String nic, @Param("status") RecordStatus status);


    @Query("SELECT c FROM Customer c WHERE c.contact = :contact AND c.status = :status")
    List<Customer> findByContactAndStatus(@Param("contact") String contact, @Param("status") RecordStatus status);

    @Query("SELECT c FROM Customer c WHERE LOWER(c.nic) = LOWER(:nic) AND c.status = :status AND c.customerId <> :excludeId")
    List<Customer> findByNicIgnoreCaseAndStatusExcludingId(@Param("nic") String nic, @Param("status") RecordStatus status, @Param("excludeId") Long excludeId);

    @Query("SELECT c FROM Customer c WHERE c.status = :status")
    List<Customer> findAllByStatus(@Param("status") RecordStatus status);
}
