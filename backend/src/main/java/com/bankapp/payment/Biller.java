package com.bankapp.payment;

import java.math.BigDecimal;

/** Prototype billers (README §5.3) with their admin fees. */
public enum Biller {

    /** Postpaid bill: inquiry → confirm → pay. */
    INDIHOME(new BigDecimal("2500")),
    /** Direct e-wallet top-up: phone number + amount. */
    GOPAY(new BigDecimal("1000"));

    private final BigDecimal fee;

    Biller(BigDecimal fee) {
        this.fee = fee;
    }

    public BigDecimal getFee() {
        return fee;
    }
}
