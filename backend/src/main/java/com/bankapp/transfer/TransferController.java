package com.bankapp.transfer;

import com.bankapp.transfer.TransferDtos.TransferOptionResponse;
import com.bankapp.transfer.TransferDtos.TransferReceiptResponse;
import com.bankapp.transfer.TransferDtos.TransferRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/transfers")
@RequiredArgsConstructor
@Tag(name = "Transfers")
public class TransferController {

    private final TransferService transferService;

    @GetMapping("/options")
    public List<TransferOptionResponse> options(@RequestParam BigDecimal amount) {
        return transferService.options(amount);
    }

    @PostMapping
    public TransferReceiptResponse execute(Authentication authentication,
                                           @Valid @RequestBody TransferRequest request) {
        return transferService.execute(userId(authentication), request);
    }

    private static UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
