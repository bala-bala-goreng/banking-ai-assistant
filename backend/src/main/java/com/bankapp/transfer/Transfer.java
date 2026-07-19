package com.bankapp.transfer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "transfers")
@Getter
@Setter
@NoArgsConstructor
public class Transfer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "transaction_id", nullable = false)
    private UUID transactionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferMethod method;

    @Column(name = "dest_bank_code", nullable = false)
    private String destBankCode;

    @Column(name = "dest_account_number", nullable = false)
    private String destAccountNumber;

    @Column(name = "dest_account_name", nullable = false)
    private String destAccountName;

    private String note;

    /** Set in Phase 3 when the transfer was initiated from an assistant intent. */
    @Column(name = "intent_id")
    private UUID intentId;
}
