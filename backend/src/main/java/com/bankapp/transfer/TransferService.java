package com.bankapp.transfer;

import com.bankapp.beneficiary.BeneficiaryRepository;
import com.bankapp.common.ApiException;
import com.bankapp.transaction.LedgerService;
import com.bankapp.transaction.Transaction;
import com.bankapp.transfer.TransferDtos.TransferOptionResponse;
import com.bankapp.transfer.TransferDtos.TransferReceiptResponse;
import com.bankapp.transfer.TransferDtos.TransferRequest;
import com.bankapp.user.User;
import com.bankapp.user.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final TransferRules transferRules;
    private final TransferRepository transferRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final PasswordEncoder passwordEncoder;

    public List<TransferOptionResponse> options(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw ApiException.badRequest("INVALID_AMOUNT", "Amount must be positive");
        }
        return transferRules.options(amount);
    }

    @Transactional
    public TransferReceiptResponse execute(UUID userId, TransferRequest request) {
        verifyPin(userId, request.pin());
        BigDecimal fee = transferRules.validateAndGetFee(request.method(), request.amount());

        Transaction tx = ledgerService.debit(request.sourceAccountId(), userId, request.amount(), fee,
                "TRANSFER", "Transfer to %s (%s %s)".formatted(
                        request.destAccountName(), request.destBankCode(), request.destAccountNumber()));

        Transfer transfer = new Transfer();
        transfer.setTransactionId(tx.getId());
        transfer.setMethod(request.method());
        transfer.setDestBankCode(request.destBankCode());
        transfer.setDestAccountNumber(request.destAccountNumber());
        transfer.setDestAccountName(request.destAccountName());
        transfer.setNote(request.note());
        transferRepository.save(transfer);

        boolean newDestination = !beneficiaryRepository.existsByUserIdAndBankCodeAndAccountNumber(
                userId, request.destBankCode(), request.destAccountNumber());

        return new TransferReceiptResponse(transfer.getId(), tx.getRefNo(), transfer.getMethod(),
                transfer.getDestBankCode(), transfer.getDestAccountNumber(), transfer.getDestAccountName(),
                tx.getAmount(), tx.getFee(), tx.getBalanceAfter(), newDestination, tx.getCreatedAt());
    }

    private void verifyPin(UUID userId, String pin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("User no longer exists"));
        if (!passwordEncoder.matches(pin, user.getPinHash())) {
            throw ApiException.badRequest("INVALID_PIN", "Incorrect transaction PIN");
        }
    }
}
