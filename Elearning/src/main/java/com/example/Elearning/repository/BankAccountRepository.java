package com.example.Elearning.repository;

import com.example.Elearning.entity.InstructorBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<InstructorBankAccount, String> {

    // Lấy tất cả TK của instructor
    List<InstructorBankAccount> findByUserId(String userId);

    // Lấy TK primary của instructor
    Optional<InstructorBankAccount> findByUserIdAndIsPrimaryTrue(String userId);

    // Lấy các TK đang active
    List<InstructorBankAccount> findByUserIdAndIsActiveTrue(String userId);

    // Check duplicate account number
    boolean existsByUserIdAndAccountNumber(String userId, String accountNumber);
}
