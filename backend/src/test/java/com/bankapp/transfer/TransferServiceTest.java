package com.bankapp.transfer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.bankapp.beneficiary.BeneficiaryRepository;
import com.bankapp.common.ApiException;
import com.bankapp.transaction.LedgerService;
import com.bankapp.transaction.Transaction;
import com.bankapp.transfer.TransferDtos.TransferReceiptResponse;
import com.bankapp.transfer.TransferDtos.TransferRequest;
import com.bankapp.user.User;
import com.bankapp.user.UserRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private TransferRepository transferRepository;
    @Mock
    private BeneficiaryRepository beneficiaryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private LedgerService ledgerService;
    @Mock
    private PasswordEncoder passwordEncoder;

    private TransferService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        // Real rules pinned to a weekday inside RTGS hours, so eligibility is deterministic.
        var instant = LocalDateTime.parse("2026-07-15T10:00").atZone(TransferRules.WIB).toInstant();
        service = new TransferService(new TransferRules(Clock.fixed(instant, TransferRules.WIB)),
                transferRepository, beneficiaryRepository, userRepository, ledgerService, passwordEncoder);
    }

    private void stubPin(boolean valid) {
        User user = new User();
        user.setId(userId);
        user.setPinHash("$hash");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("123456", "$hash")).thenReturn(valid);
    }

    private TransferRequest request(TransferMethod method, String amount) {
        return new TransferRequest(accountId, "BCA", "1234567890", "BUDI SETIAWAN",
                new BigDecimal(amount), method, null, "123456");
    }

    @Test
    void executeDebitsWithMethodFeeAndSavesTransferDetail() {
        stubPin(true);
        Transaction tx = new Transaction();
        tx.setId(UUID.randomUUID());
        tx.setAmount(new BigDecimal("15000"));
        tx.setFee(new BigDecimal("2500"));
        tx.setRefNo("TRX123");
        tx.setBalanceAfter(new BigDecimal("982500"));
        tx.setCreatedAt(OffsetDateTime.now());
        when(ledgerService.debit(eq(accountId), eq(userId), eq(new BigDecimal("15000")),
                eq(new BigDecimal("2500")), eq("TRANSFER"), any())).thenReturn(tx);
        when(beneficiaryRepository.existsByUserIdAndBankCodeAndAccountNumber(userId, "BCA", "1234567890"))
                .thenReturn(false);

        TransferReceiptResponse receipt = service.execute(userId, request(TransferMethod.BI_FAST, "15000"));

        verify(transferRepository).save(any(Transfer.class));
        assertThat(receipt.refNo()).isEqualTo("TRX123");
        assertThat(receipt.fee()).isEqualByComparingTo("2500");
        assertThat(receipt.newDestination()).isTrue();
    }

    @Test
    void knownBeneficiaryIsNotFlaggedAsNewDestination() {
        stubPin(true);
        Transaction tx = new Transaction();
        tx.setAmount(new BigDecimal("15000"));
        tx.setFee(new BigDecimal("2500"));
        tx.setBalanceAfter(BigDecimal.TEN);
        when(ledgerService.debit(any(), any(), any(), any(), any(), any())).thenReturn(tx);
        when(beneficiaryRepository.existsByUserIdAndBankCodeAndAccountNumber(userId, "BCA", "1234567890"))
                .thenReturn(true);

        assertThat(service.execute(userId, request(TransferMethod.BI_FAST, "15000")).newDestination()).isFalse();
    }

    @Test
    void wrongPinRejectsBeforeTouchingTheLedger() {
        stubPin(false);

        assertThatThrownBy(() -> service.execute(userId, request(TransferMethod.BI_FAST, "15000")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "INVALID_PIN");
        verifyNoInteractions(ledgerService, transferRepository);
    }

    @Test
    void ineligibleMethodIsRejected() {
        stubPin(true);

        // 15.000 is far below the RTGS minimum
        assertThatThrownBy(() -> service.execute(userId, request(TransferMethod.RTGS, "15000")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "METHOD_NOT_ELIGIBLE");
        verifyNoInteractions(ledgerService);
    }

    @Test
    void optionsRejectsNonPositiveAmount() {
        assertThatThrownBy(() -> service.options(BigDecimal.ZERO))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "INVALID_AMOUNT");
    }
}
