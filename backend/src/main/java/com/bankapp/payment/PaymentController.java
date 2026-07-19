package com.bankapp.payment;

import com.bankapp.payment.PaymentDtos.InquiryRequest;
import com.bankapp.payment.PaymentDtos.InquiryResponse;
import com.bankapp.payment.PaymentDtos.PaymentReceiptResponse;
import com.bankapp.payment.PaymentDtos.PaymentRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/inquiry")
    public InquiryResponse inquiry(Authentication authentication,
                                   @Valid @RequestBody InquiryRequest request) {
        return paymentService.inquiry(userId(authentication), request);
    }

    @PostMapping
    public PaymentReceiptResponse pay(Authentication authentication,
                                      @Valid @RequestBody PaymentRequest request) {
        return paymentService.pay(userId(authentication), request);
    }

    private static UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
