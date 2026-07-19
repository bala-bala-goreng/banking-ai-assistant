package com.bankapp.transfer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class TransferDtos {

    private TransferDtos() {
    }

    public record TransferOptionResponse(TransferMethod method, BigDecimal fee,
                                         BigDecimal minAmount, BigDecimal maxAmount) {
    }

    public record TransferRequest(
            @NotNull UUID sourceAccountId,
            @NotBlank @Size(max = 10) String destBankCode,
            @NotBlank @Size(max = 30) String destAccountNumber,
            @NotBlank @Size(max = 100) String destAccountName,
            @NotNull @Positive BigDecimal amount,
            @NotNull TransferMethod method,
            @Size(max = 200) String note,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "PIN must be 6 digits") String pin) {
    }

    public record TransferReceiptResponse(UUID transferId, String refNo, TransferMethod method,
                                          String destBankCode, String destAccountNumber, String destAccountName,
                                          BigDecimal amount, BigDecimal fee, BigDecimal balanceAfter,
                                          boolean newDestination, OffsetDateTime createdAt) {
    }
}
