package com.bankapp.transaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.bankapp.account.Account;
import com.bankapp.account.AccountRepository;
import com.bankapp.common.ApiException;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class LedgerServiceTest {

    @Mock
    private AccountRepository accountRepository;
    @Mock
    private TransactionRepository transactionRepository;

    private LedgerService ledgerService;

    private final UUID userId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ledgerService = new LedgerService(accountRepository, transactionRepository);
    }

    private Account account(BigDecimal balance) {
        Account account = new Account();
        account.setId(accountId);
        account.setUserId(userId);
        account.setBalance(balance);
        account.setStatus("ACTIVE");
        return account;
    }

    @Test
    void debitSubtractsAmountPlusFeeAndRecordsBalanceAfter() {
        Account account = account(new BigDecimal("100000"));
        when(accountRepository.findForUpdate(accountId)).thenReturn(Optional.of(account));
        when(transactionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Transaction tx = ledgerService.debit(accountId, userId, new BigDecimal("50000"),
                new BigDecimal("2500"), "TRANSFER", "test");

        assertThat(account.getBalance()).isEqualByComparingTo("47500");
        assertThat(tx.getBalanceAfter()).isEqualByComparingTo("47500");
        assertThat(tx.getDirection()).isEqualTo(Transaction.Direction.DEBIT);
        assertThat(tx.getRefNo()).startsWith("TRX");
    }

    @Test
    void debitFailsWhenBalanceCannotCoverAmountPlusFee() {
        // 10.000 balance covers the amount but not amount + fee
        when(accountRepository.findForUpdate(accountId)).thenReturn(Optional.of(account(new BigDecimal("10000"))));

        assertThatThrownBy(() -> ledgerService.debit(accountId, userId, new BigDecimal("10000"),
                new BigDecimal("2500"), "TRANSFER", "test"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "INSUFFICIENT_BALANCE");
        verifyNoInteractions(transactionRepository);
    }

    @Test
    void debitFailsForAnotherUsersAccount() {
        Account account = account(new BigDecimal("100000"));
        account.setUserId(UUID.randomUUID());
        when(accountRepository.findForUpdate(accountId)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> ledgerService.debit(accountId, userId, new BigDecimal("50000"),
                BigDecimal.ZERO, "TRANSFER", "test"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    void debitFailsForInactiveAccount() {
        Account account = account(new BigDecimal("100000"));
        account.setStatus("BLOCKED");
        when(accountRepository.findForUpdate(accountId)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> ledgerService.debit(accountId, userId, new BigDecimal("50000"),
                BigDecimal.ZERO, "TRANSFER", "test"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "ACCOUNT_INACTIVE");
    }

    @Test
    void debitFailsForUnknownAccount() {
        when(accountRepository.findForUpdate(accountId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ledgerService.debit(accountId, userId, new BigDecimal("50000"),
                BigDecimal.ZERO, "TRANSFER", "test"))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }
}
