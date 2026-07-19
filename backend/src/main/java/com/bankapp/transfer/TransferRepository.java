package com.bankapp.transfer;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransferRepository extends JpaRepository<Transfer, UUID> {

    /**
     * Whether this user has ever completed a transfer to the destination —
     * the precondition for saving it as a beneficiary (README §5.5).
     */
    @Query("""
            select count(t) > 0
            from Transfer t, com.bankapp.transaction.Transaction tx, com.bankapp.account.Account a
            where t.transactionId = tx.id
              and tx.accountId = a.id
              and a.userId = :userId
              and t.destBankCode = :bankCode
              and t.destAccountNumber = :accountNumber
            """)
    boolean existsTransferToDestination(@Param("userId") UUID userId,
                                        @Param("bankCode") String bankCode,
                                        @Param("accountNumber") String accountNumber);
}
