package com.bankapp.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.bankapp.common.ApiException;
import com.bankapp.payment.PaymentDtos.InquiryRequest;
import com.bankapp.payment.PaymentDtos.InquiryResponse;
import com.bankapp.payment.PaymentDtos.PaymentRequest;
import com.bankapp.transaction.LedgerService;
import com.bankapp.transaction.Transaction;
import com.bankapp.user.User;
import com.bankapp.user.UserRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private LedgerService ledgerService;
    @Mock
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private PaymentService service;

    private final UUID userId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new PaymentService(new MockBillerClient(), paymentRepository, userRepository,
                ledgerService, passwordEncoder);
        User user = new User();
        user.setId(userId);
        user.setPinHash("$hash");
        lenient().when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        lenient().when(passwordEncoder.matches("123456", "$hash")).thenReturn(true);
        lenient().when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private Transaction tx(String amount, String fee) {
        Transaction tx = new Transaction();
        tx.setId(UUID.randomUUID());
        tx.setAmount(new BigDecimal(amount));
        tx.setFee(new BigDecimal(fee));
        tx.setRefNo("TRX123");
        tx.setBalanceAfter(BigDecimal.TEN);
        return tx;
    }

    @Test
    void inquiryIsIndihomeOnly() {
        assertThatThrownBy(() -> service.inquiry(userId, new InquiryRequest(Biller.GOPAY, "0812345678")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "INQUIRY_NOT_SUPPORTED");
    }

    @Test
    void indihomeInquiryThenPayDebitsTheBillAmountAndConsumesTheInquiry() {
        InquiryResponse inquiry = service.inquiry(userId, new InquiryRequest(Biller.INDIHOME, "130001234567"));
        assertThat(inquiry.customerName()).isNotBlank();
        assertThat(inquiry.amount()).isPositive();
        assertThat(inquiry.fee()).isEqualByComparingTo("2500");

        when(ledgerService.debit(eq(accountId), eq(userId), eq(inquiry.amount()),
                eq(new BigDecimal("2500")), eq("PAYMENT"), any())).thenReturn(tx("285000", "2500"));

        PaymentRequest pay = new PaymentRequest(Biller.INDIHOME, inquiry.inquiryId(), null, null, accountId, "123456");
        var receipt = service.pay(userId, pay);
        assertThat(receipt.biller()).isEqualTo(Biller.INDIHOME);
        assertThat(receipt.customerNumber()).isEqualTo("130001234567");

        // single-use: the same inquiry cannot be paid twice
        assertThatThrownBy(() -> service.pay(userId, pay))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "INQUIRY_INVALID");
    }

    @Test
    void indihomePayRejectsAnotherUsersInquiry() {
        InquiryResponse inquiry = service.inquiry(userId, new InquiryRequest(Biller.INDIHOME, "130001234567"));
        UUID otherUser = UUID.randomUUID();
        User other = new User();
        other.setId(otherUser);
        other.setPinHash("$hash");
        when(userRepository.findById(otherUser)).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.pay(otherUser,
                new PaymentRequest(Biller.INDIHOME, inquiry.inquiryId(), null, null, accountId, "123456")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "INQUIRY_INVALID");
        verifyNoInteractions(ledgerService);
    }

    @Test
    void indihomePayRequiresAnInquiryId() {
        assertThatThrownBy(() -> service.pay(userId,
                new PaymentRequest(Biller.INDIHOME, null, null, null, accountId, "123456")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "INQUIRY_REQUIRED");
    }

    @Test
    void gopayTopUpDebitsWithTopupCategory() {
        when(ledgerService.debit(eq(accountId), eq(userId), eq(new BigDecimal("50000")),
                eq(new BigDecimal("1000")), eq("TOPUP"), any())).thenReturn(tx("50000", "1000"));

        var receipt = service.pay(userId,
                new PaymentRequest(Biller.GOPAY, null, "081234567890", new BigDecimal("50000"), accountId, "123456"));

        assertThat(receipt.biller()).isEqualTo(Biller.GOPAY);
        assertThat(receipt.fee()).isEqualByComparingTo("1000");
    }

    @Test
    void gopayRejectsInvalidPhoneAndOutOfRangeAmounts() {
        assertThatThrownBy(() -> service.pay(userId,
                new PaymentRequest(Biller.GOPAY, null, "9999", new BigDecimal("50000"), accountId, "123456")))
                .hasFieldOrPropertyWithValue("code", "INVALID_PHONE");

        assertThatThrownBy(() -> service.pay(userId,
                new PaymentRequest(Biller.GOPAY, null, "081234567890", new BigDecimal("5000"), accountId, "123456")))
                .hasFieldOrPropertyWithValue("code", "INVALID_AMOUNT");

        assertThatThrownBy(() -> service.pay(userId,
                new PaymentRequest(Biller.GOPAY, null, "081234567890", new BigDecimal("5000000"), accountId, "123456")))
                .hasFieldOrPropertyWithValue("code", "INVALID_AMOUNT");
        verifyNoInteractions(ledgerService);
    }

    @Test
    void wrongPinRejectsBeforeAnyDebit() {
        when(passwordEncoder.matches("999999", "$hash")).thenReturn(false);

        assertThatThrownBy(() -> service.pay(userId,
                new PaymentRequest(Biller.GOPAY, null, "081234567890", new BigDecimal("50000"), accountId, "999999")))
                .hasFieldOrPropertyWithValue("code", "INVALID_PIN");
        verifyNoInteractions(ledgerService);
    }
}
