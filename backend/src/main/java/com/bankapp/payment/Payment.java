package com.bankapp.payment;

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
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "transaction_id", nullable = false)
    private UUID transactionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Biller biller;

    @Column(name = "customer_number", nullable = false)
    private String customerNumber;

    @Column(name = "customer_name")
    private String customerName;

    /** Billing period, e.g. "JUN 2026" — postpaid billers only. */
    private String period;

    /** Set in Phase 3 when the payment was initiated from an assistant intent. */
    @Column(name = "intent_id")
    private UUID intentId;
}
