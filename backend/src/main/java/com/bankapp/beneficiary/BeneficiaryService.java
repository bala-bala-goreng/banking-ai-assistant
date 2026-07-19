package com.bankapp.beneficiary;

import com.bankapp.beneficiary.BeneficiaryDtos.BeneficiaryResponse;
import com.bankapp.beneficiary.BeneficiaryDtos.CreateBeneficiaryRequest;
import com.bankapp.common.ApiException;
import com.bankapp.transfer.TransferRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final TransferRepository transferRepository;

    public List<BeneficiaryResponse> list(UUID userId) {
        return beneficiaryRepository.findByUserIdOrderByAliasAsc(userId).stream()
                .map(BeneficiaryResponse::from)
                .toList();
    }

    @Transactional
    public BeneficiaryResponse create(UUID userId, CreateBeneficiaryRequest request) {
        if (beneficiaryRepository.existsByUserIdAndBankCodeAndAccountNumber(
                userId, request.bankCode(), request.accountNumber())) {
            throw ApiException.conflict("BENEFICIARY_EXISTS", "This destination is already saved as a favorite");
        }
        // README §5.5: a destination is only saveable after at least one successful transfer to it.
        if (!transferRepository.existsTransferToDestination(userId, request.bankCode(), request.accountNumber())) {
            throw ApiException.badRequest("NO_PRIOR_TRANSFER",
                    "A destination can only be saved after a successful transfer to it");
        }
        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUserId(userId);
        beneficiary.setAlias(request.alias());
        beneficiary.setBankCode(request.bankCode());
        beneficiary.setAccountNumber(request.accountNumber());
        beneficiary.setAccountName(request.accountName());
        return BeneficiaryResponse.from(beneficiaryRepository.save(beneficiary));
    }

    @Transactional
    public void delete(UUID userId, UUID beneficiaryId) {
        Beneficiary beneficiary = beneficiaryRepository.findByIdAndUserId(beneficiaryId, userId)
                .orElseThrow(() -> ApiException.notFound("Beneficiary not found"));
        beneficiaryRepository.delete(beneficiary);
    }
}
