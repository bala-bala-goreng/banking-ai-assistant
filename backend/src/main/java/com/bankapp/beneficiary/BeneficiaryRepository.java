package com.bankapp.beneficiary;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BeneficiaryRepository extends JpaRepository<Beneficiary, UUID> {

    List<Beneficiary> findByUserIdOrderByAliasAsc(UUID userId);

    Optional<Beneficiary> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndBankCodeAndAccountNumber(UUID userId, String bankCode, String accountNumber);
}
