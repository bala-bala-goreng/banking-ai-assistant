package com.bankapp.account;

import com.bankapp.account.AccountDtos.AccountResponse;
import com.bankapp.account.AccountDtos.TransactionResponse;
import com.bankapp.common.ApiException;
import com.bankapp.common.PageResponse;
import com.bankapp.transaction.TransactionRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public List<AccountResponse> myAccounts(UUID userId) {
        return accountRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(AccountResponse::from)
                .toList();
    }

    public PageResponse<TransactionResponse> transactions(UUID userId, UUID accountId, int page, int size) {
        accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.notFound("Account not found"));
        var result = transactionRepository
                .findByAccountIdOrderByCreatedAtDesc(accountId, PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100)))
                .map(TransactionResponse::from);
        return PageResponse.from(result);
    }
}
