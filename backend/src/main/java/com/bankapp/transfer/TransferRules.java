package com.bankapp.transfer;

import com.bankapp.common.ApiException;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Single source of truth for transfer method eligibility (README §5.4): the app's
 * GET /transfers/options and the Phase-2 MCP tool get_transfer_options both go
 * through here, so app and assistant can never disagree.
 */
@Service
public class TransferRules {

    static final ZoneId WIB = ZoneId.of("Asia/Jakarta");
    private static final LocalTime RTGS_OPEN = LocalTime.of(8, 0);
    private static final LocalTime RTGS_CLOSE = LocalTime.of(15, 0);

    private final Clock clock;

    public TransferRules() {
        this(Clock.system(WIB));
    }

    TransferRules(Clock clock) {
        this.clock = clock;
    }

    /** Only the methods valid for this amount right now, each with its fee. */
    public List<TransferDtos.TransferOptionResponse> options(BigDecimal amount) {
        List<TransferDtos.TransferOptionResponse> eligible = new ArrayList<>();
        for (TransferMethod method : TransferMethod.values()) {
            if (ineligibilityReason(method, amount).isEmpty()) {
                eligible.add(new TransferDtos.TransferOptionResponse(
                        method, method.getFee(), method.getMinAmount(), method.getMaxAmount()));
            }
        }
        return eligible;
    }

    /** Validates the chosen method for this amount and returns its fee, or throws 400. */
    public BigDecimal validateAndGetFee(TransferMethod method, BigDecimal amount) {
        ineligibilityReason(method, amount).ifPresent(reason -> {
            throw ApiException.badRequest("METHOD_NOT_ELIGIBLE", reason);
        });
        return method.getFee();
    }

    private Optional<String> ineligibilityReason(TransferMethod method, BigDecimal amount) {
        if (amount.compareTo(method.getMinAmount()) < 0) {
            return Optional.of("%s requires a minimum amount of Rp%,d".formatted(
                    method, method.getMinAmount().longValue()));
        }
        if (method.getMaxAmount() != null && amount.compareTo(method.getMaxAmount()) > 0) {
            return Optional.of("%s allows at most Rp%,d per transaction".formatted(
                    method, method.getMaxAmount().longValue()));
        }
        if (method == TransferMethod.RTGS && !isRtgsOpen()) {
            return Optional.of("RTGS is available Mon-Fri 08:00-15:00 WIB only");
        }
        return Optional.empty();
    }

    private boolean isRtgsOpen() {
        ZonedDateTime now = ZonedDateTime.now(clock).withZoneSameInstant(WIB);
        DayOfWeek day = now.getDayOfWeek();
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return false;
        }
        LocalTime time = now.toLocalTime();
        return !time.isBefore(RTGS_OPEN) && time.isBefore(RTGS_CLOSE);
    }
}
