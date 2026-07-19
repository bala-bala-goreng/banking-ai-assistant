package com.bankapp.transfer;

import java.math.BigDecimal;

/**
 * Interbank transfer rails with the prototype default fees/limits from README §5.4.
 * Availability rules (RTGS business hours) live in {@link TransferRules}.
 */
public enum TransferMethod {

    BI_FAST(new BigDecimal("2500"), new BigDecimal("10000"), new BigDecimal("250000000")),
    ONLINE(new BigDecimal("6500"), new BigDecimal("10000"), new BigDecimal("25000000")),
    RTGS(new BigDecimal("25000"), new BigDecimal("100000001"), null);

    private final BigDecimal fee;
    private final BigDecimal minAmount;
    private final BigDecimal maxAmount; // null = no cap

    TransferMethod(BigDecimal fee, BigDecimal minAmount, BigDecimal maxAmount) {
        this.fee = fee;
        this.minAmount = minAmount;
        this.maxAmount = maxAmount;
    }

    public BigDecimal getFee() {
        return fee;
    }

    public BigDecimal getMinAmount() {
        return minAmount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }
}
