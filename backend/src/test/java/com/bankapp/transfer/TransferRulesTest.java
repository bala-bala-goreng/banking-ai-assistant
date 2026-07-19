package com.bankapp.transfer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bankapp.common.ApiException;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class TransferRulesTest {

    // 2026-07-15 is a Wednesday; 2026-07-18 a Saturday.
    private static final String BUSINESS_HOURS = "2026-07-15T10:00";
    private static final String AFTER_HOURS = "2026-07-15T16:00";
    private static final String SATURDAY = "2026-07-18T10:00";

    private static TransferRules rulesAt(String wibDateTime) {
        var instant = LocalDateTime.parse(wibDateTime).atZone(TransferRules.WIB).toInstant();
        return new TransferRules(Clock.fixed(instant, TransferRules.WIB));
    }

    private static List<TransferMethod> methods(List<TransferDtos.TransferOptionResponse> options) {
        return options.stream().map(TransferDtos.TransferOptionResponse::method).toList();
    }

    @Test
    void smallAmountGetsBiFastAndOnlineOnly() {
        var options = rulesAt(BUSINESS_HOURS).options(new BigDecimal("15000"));
        assertThat(methods(options)).containsExactly(TransferMethod.BI_FAST, TransferMethod.ONLINE);
        assertThat(options.getFirst().fee()).isEqualByComparingTo("2500");
        assertThat(options.get(1).fee()).isEqualByComparingTo("6500");
    }

    @Test
    void belowEveryMinimumGetsNoOptions() {
        assertThat(rulesAt(BUSINESS_HOURS).options(new BigDecimal("5000"))).isEmpty();
    }

    @Test
    void aboveOnlineCapDropsOnline() {
        var options = rulesAt(BUSINESS_HOURS).options(new BigDecimal("30000000"));
        assertThat(methods(options)).containsExactly(TransferMethod.BI_FAST);
    }

    @Test
    void rtgsAppearsAboveItsMinimumDuringBusinessHours() {
        var options = rulesAt(BUSINESS_HOURS).options(new BigDecimal("150000000"));
        assertThat(methods(options)).containsExactly(TransferMethod.BI_FAST, TransferMethod.RTGS);
    }

    @Test
    void rtgsHiddenAfterHoursAndOnWeekends() {
        var amount = new BigDecimal("150000000");
        assertThat(methods(rulesAt(AFTER_HOURS).options(amount))).containsExactly(TransferMethod.BI_FAST);
        assertThat(methods(rulesAt(SATURDAY).options(amount))).containsExactly(TransferMethod.BI_FAST);
    }

    @Test
    void aboveBiFastCapLeavesOnlyRtgs() {
        var options = rulesAt(BUSINESS_HOURS).options(new BigDecimal("300000000"));
        assertThat(methods(options)).containsExactly(TransferMethod.RTGS);
    }

    @Test
    void validateReturnsFeeForEligibleMethod() {
        assertThat(rulesAt(BUSINESS_HOURS).validateAndGetFee(TransferMethod.BI_FAST, new BigDecimal("15000")))
                .isEqualByComparingTo("2500");
    }

    @Test
    void validateRejectsAmountBelowMinimum() {
        assertThatThrownBy(() -> rulesAt(BUSINESS_HOURS).validateAndGetFee(TransferMethod.RTGS, new BigDecimal("15000")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "METHOD_NOT_ELIGIBLE");
    }

    @Test
    void validateRejectsRtgsOutsideBusinessHours() {
        assertThatThrownBy(() -> rulesAt(SATURDAY).validateAndGetFee(TransferMethod.RTGS, new BigDecimal("150000000")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "METHOD_NOT_ELIGIBLE");
    }
}
