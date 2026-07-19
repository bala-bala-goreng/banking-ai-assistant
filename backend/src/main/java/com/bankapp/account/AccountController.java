package com.bankapp.account;

import com.bankapp.account.AccountDtos.AccountResponse;
import com.bankapp.account.AccountDtos.TransactionResponse;
import com.bankapp.common.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Accounts")
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public List<AccountResponse> list(Authentication authentication) {
        return accountService.myAccounts(userId(authentication));
    }

    @GetMapping("/{id}/transactions")
    public PageResponse<TransactionResponse> transactions(Authentication authentication,
                                                          @PathVariable UUID id,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        return accountService.transactions(userId(authentication), id, page, size);
    }

    private static UUID userId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
