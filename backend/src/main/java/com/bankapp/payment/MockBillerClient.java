package com.bankapp.payment;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Component;

/**
 * Stand-in for a real biller integration: returns a deterministic mock bill for
 * any IndiHome customer number, so inquiries are stable and demo-able (README §5.3).
 */
@Component
public class MockBillerClient {

    private static final String[] NAMES = {
            "BUDI SANTOSO", "SITI RAHAYU", "AGUS WIJAYA", "DEWI LESTARI",
            "RUDI HARTONO", "RINA MARLINA", "JOKO PRASETYO", "MAYA PUSPITA"
    };
    private static final DateTimeFormatter PERIOD = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

    public record Bill(String customerName, String period, BigDecimal amount) {
    }

    public Bill lookupIndihomeBill(String customerNumber) {
        int hash = Math.abs(customerNumber.hashCode());
        String name = NAMES[hash % NAMES.length];
        // Stable pseudo-random bill between Rp150.000 and Rp449.900
        BigDecimal amount = BigDecimal.valueOf(150_000L + (hash % 3000) * 100L);
        String period = YearMonth.now().minusMonths(1).format(PERIOD).toUpperCase(Locale.ENGLISH);
        return new Bill(name, period, amount);
    }
}
