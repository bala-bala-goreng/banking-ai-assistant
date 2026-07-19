package com.bankapp.transaction;

import com.bankapp.account.Account;
import com.bankapp.account.AccountRepository;
import com.bankapp.common.ApiException;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * The single write path to account balances: locks the account row, verifies funds,
 * mutates the balance and appends the ledger row — all inside the caller's transaction,
 * so a transfer/payment and its ledger entry commit (or roll back) together.
 */
@Service
@RequiredArgsConstructor
public class LedgerService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter REF_TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public Transaction debit(UUID accountId, UUID userId, BigDecimal amount, BigDecimal fee,
                             String category, String description) {
        Account account = accountRepository.findForUpdate(accountId)
                .orElseThrow(() -> ApiException.notFound("Account not found"));
        if (!account.getUserId().equals(userId)) {
            throw ApiException.forbidden("Account does not belong to the authenticated user");
        }
        if (!"ACTIVE".equals(account.getStatus())) {
            throw ApiException.badRequest("ACCOUNT_INACTIVE", "Account is not active");
        }
        if (amount.signum() <= 0) {
            throw ApiException.badRequest("INVALID_AMOUNT", "Amount must be positive");
        }
        BigDecimal total = amount.add(fee);
        if (account.getBalance().compareTo(total) < 0) {
            throw ApiException.badRequest("INSUFFICIENT_BALANCE", "Balance is not enough for amount + fee");
        }
        account.setBalance(account.getBalance().subtract(total));

        Transaction tx = new Transaction();
        tx.setAccountId(account.getId());
        tx.setDirection(Transaction.Direction.DEBIT);
        tx.setAmount(amount);
        tx.setFee(fee);
        tx.setCategory(category);
        tx.setDescription(description);
        tx.setRefNo(generateRefNo());
        tx.setBalanceAfter(account.getBalance());
        return transactionRepository.save(tx);
    }

    private String generateRefNo() {
        return "TRX" + LocalDateTime.now(ZoneOffset.UTC).format(REF_TS) + "%04d".formatted(RANDOM.nextInt(10_000));
    }
}
