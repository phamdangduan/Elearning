package com.example.Elearning.repository;

import com.example.Elearning.entity.PaymentTransaction;
import com.example.Elearning.enums.TransactionMatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, String> {

    boolean existsByProviderAndProviderTransactionId(String provider, String providerTransactionId);

    List<PaymentTransaction> findByMatchStatusInOrderByCreatedAtDesc(List<TransactionMatchStatus> statuses);

    List<PaymentTransaction> findAllByOrderByCreatedAtDesc();
}
