package com.bankapp.account;

import com.bankapp.transaction.Transaction;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class AccountDtos {

    private AccountDtos() {
    }

    public record AccountResponse(UUID id, String accountNumber, String maskedNumber, AccountType accountType,
                                  BigDecimal balance, String currency, String status) {

        public static AccountResponse from(Account a) {
            return new AccountResponse(a.getId(), a.getAccountNumber(), mask(a.getAccountNumber()),
                    a.getAccountType(), a.getBalance(), a.getCurrency(), a.getStatus());
        }

        private static String mask(String number) {
            return number.length() <= 4 ? number : "•••" + number.substring(number.length() - 4);
        }
    }

    public record TransactionResponse(UUID id, Transaction.Direction direction, BigDecimal amount, BigDecimal fee,
                                      String category, String refNo, String description, BigDecimal balanceAfter,
                                      OffsetDateTime createdAt) {

        public static TransactionResponse from(Transaction t) {
            return new TransactionResponse(t.getId(), t.getDirection(), t.getAmount(), t.getFee(), t.getCategory(),
                    t.getRefNo(), t.getDescription(), t.getBalanceAfter(), t.getCreatedAt());
        }
    }
}
