package com.bankapp.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class PaymentDtos {

    private PaymentDtos() {
    }

    public record InquiryRequest(
            @NotNull Biller biller,
            @NotBlank @Size(max = 30) String customerNumber) {
    }

    public record InquiryResponse(UUID inquiryId, Biller biller, String customerNumber, String customerName,
                                  String period, BigDecimal amount, BigDecimal fee, OffsetDateTime expiresAt) {
    }

    /**
     * INDIHOME: pay a previous inquiry — {@code inquiryId} required, amount comes from the bill.
     * GOPAY: direct top-up — {@code customerNumber} (phone) and {@code amount} required.
     */
    public record PaymentRequest(
            @NotNull Biller biller,
            UUID inquiryId,
            @Size(max = 30) String customerNumber,
            @Positive BigDecimal amount,
            @NotNull UUID sourceAccountId,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "PIN must be 6 digits") String pin) {
    }

    public record PaymentReceiptResponse(UUID paymentId, String refNo, Biller biller, String customerNumber,
                                         String customerName, String period, BigDecimal amount, BigDecimal fee,
                                         BigDecimal balanceAfter, OffsetDateTime createdAt) {
    }
}
