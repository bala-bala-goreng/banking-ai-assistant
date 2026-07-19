package com.bankapp.beneficiary;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class BeneficiaryDtos {

    private BeneficiaryDtos() {
    }

    public record CreateBeneficiaryRequest(
            @NotBlank @Size(max = 50) String alias,
            @NotBlank @Size(max = 10) String bankCode,
            @NotBlank @Size(max = 30) String accountNumber,
            @NotBlank @Size(max = 100) String accountName) {
    }

    public record BeneficiaryResponse(UUID id, String alias, String bankCode, String accountNumber,
                                      String accountName, OffsetDateTime createdAt) {

        public static BeneficiaryResponse from(Beneficiary b) {
            return new BeneficiaryResponse(b.getId(), b.getAlias(), b.getBankCode(), b.getAccountNumber(),
                    b.getAccountName(), b.getCreatedAt());
        }
    }
}
