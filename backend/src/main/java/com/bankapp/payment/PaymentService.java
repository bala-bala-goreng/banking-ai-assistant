package com.bankapp.payment;

import com.bankapp.common.ApiException;
import com.bankapp.payment.PaymentDtos.InquiryRequest;
import com.bankapp.payment.PaymentDtos.InquiryResponse;
import com.bankapp.payment.PaymentDtos.PaymentReceiptResponse;
import com.bankapp.payment.PaymentDtos.PaymentRequest;
import com.bankapp.transaction.LedgerService;
import com.bankapp.transaction.Transaction;
import com.bankapp.user.User;
import com.bankapp.user.UserRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final int INQUIRY_TTL_MINUTES = 10;
    private static final BigDecimal GOPAY_MIN = new BigDecimal("10000");
    private static final BigDecimal GOPAY_MAX = new BigDecimal("2000000");

    private final MockBillerClient billerClient;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Pending IndiHome inquiries, single-use with a short TTL. In-memory is fine for the
     * prototype: an app restart just means the user re-runs the inquiry.
     */
    private final Map<UUID, PendingInquiry> pendingInquiries = new ConcurrentHashMap<>();

    private record PendingInquiry(UUID id, UUID userId, Biller biller, String customerNumber, String customerName,
                                  String period, BigDecimal amount, OffsetDateTime expiresAt) {

        boolean expired() {
            return OffsetDateTime.now().isAfter(expiresAt);
        }
    }

    public InquiryResponse inquiry(UUID userId, InquiryRequest request) {
        if (request.biller() != Biller.INDIHOME) {
            throw ApiException.badRequest("INQUIRY_NOT_SUPPORTED",
                    "Only INDIHOME supports bill inquiry; GOPAY is a direct top-up");
        }
        pendingInquiries.values().removeIf(PendingInquiry::expired);

        MockBillerClient.Bill bill = billerClient.lookupIndihomeBill(request.customerNumber());
        PendingInquiry inquiry = new PendingInquiry(UUID.randomUUID(), userId, request.biller(),
                request.customerNumber(), bill.customerName(), bill.period(), bill.amount(),
                OffsetDateTime.now().plusMinutes(INQUIRY_TTL_MINUTES));
        pendingInquiries.put(inquiry.id(), inquiry);

        return new InquiryResponse(inquiry.id(), inquiry.biller(), inquiry.customerNumber(),
                inquiry.customerName(), inquiry.period(), inquiry.amount(), Biller.INDIHOME.getFee(),
                inquiry.expiresAt());
    }

    @Transactional
    public PaymentReceiptResponse pay(UUID userId, PaymentRequest request) {
        verifyPin(userId, request.pin());
        return switch (request.biller()) {
            case INDIHOME -> payIndihome(userId, request);
            case GOPAY -> topUpGopay(userId, request);
        };
    }

    private PaymentReceiptResponse payIndihome(UUID userId, PaymentRequest request) {
        if (request.inquiryId() == null) {
            throw ApiException.badRequest("INQUIRY_REQUIRED", "IndiHome payment requires an inquiryId");
        }
        PendingInquiry inquiry = pendingInquiries.get(request.inquiryId());
        if (inquiry == null || !inquiry.userId().equals(userId) || inquiry.expired()) {
            throw ApiException.badRequest("INQUIRY_INVALID", "Inquiry not found or expired — please inquire again");
        }
        Transaction tx = ledgerService.debit(request.sourceAccountId(), userId, inquiry.amount(),
                Biller.INDIHOME.getFee(), "PAYMENT",
                "IndiHome bill %s (%s)".formatted(inquiry.customerNumber(), inquiry.period()));
        pendingInquiries.remove(inquiry.id());

        return receipt(saveDetail(tx, Biller.INDIHOME, inquiry.customerNumber(),
                inquiry.customerName(), inquiry.period()), tx);
    }

    private PaymentReceiptResponse topUpGopay(UUID userId, PaymentRequest request) {
        if (request.customerNumber() == null || !request.customerNumber().matches("08\\d{7,13}")) {
            throw ApiException.badRequest("INVALID_PHONE", "GoPay top-up requires a phone number starting with 08");
        }
        if (request.amount() == null || request.amount().compareTo(GOPAY_MIN) < 0
                || request.amount().compareTo(GOPAY_MAX) > 0) {
            throw ApiException.badRequest("INVALID_AMOUNT",
                    "GoPay top-up must be between Rp10.000 and Rp2.000.000");
        }
        Transaction tx = ledgerService.debit(request.sourceAccountId(), userId, request.amount(),
                Biller.GOPAY.getFee(), "TOPUP", "GoPay top-up " + request.customerNumber());

        return receipt(saveDetail(tx, Biller.GOPAY, request.customerNumber(), null, null), tx);
    }

    private Payment saveDetail(Transaction tx, Biller biller, String customerNumber,
                               String customerName, String period) {
        Payment payment = new Payment();
        payment.setTransactionId(tx.getId());
        payment.setBiller(biller);
        payment.setCustomerNumber(customerNumber);
        payment.setCustomerName(customerName);
        payment.setPeriod(period);
        return paymentRepository.save(payment);
    }

    private PaymentReceiptResponse receipt(Payment payment, Transaction tx) {
        return new PaymentReceiptResponse(payment.getId(), tx.getRefNo(), payment.getBiller(),
                payment.getCustomerNumber(), payment.getCustomerName(), payment.getPeriod(),
                tx.getAmount(), tx.getFee(), tx.getBalanceAfter(), tx.getCreatedAt());
    }

    private void verifyPin(UUID userId, String pin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("User no longer exists"));
        if (!passwordEncoder.matches(pin, user.getPinHash())) {
            throw ApiException.badRequest("INVALID_PIN", "Incorrect transaction PIN");
        }
    }
}
