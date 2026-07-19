package com.bankapp.beneficiary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bankapp.beneficiary.BeneficiaryDtos.CreateBeneficiaryRequest;
import com.bankapp.common.ApiException;
import com.bankapp.transfer.TransferRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class BeneficiaryServiceTest {

    @Mock
    private BeneficiaryRepository beneficiaryRepository;
    @Mock
    private TransferRepository transferRepository;

    private BeneficiaryService service;

    private final UUID userId = UUID.randomUUID();
    private final CreateBeneficiaryRequest request =
            new CreateBeneficiaryRequest("Budi", "BCA", "1234567890", "BUDI SETIAWAN");

    @BeforeEach
    void setUp() {
        service = new BeneficiaryService(beneficiaryRepository, transferRepository);
    }

    @Test
    void createRequiresAPriorTransferToTheDestination() {
        when(beneficiaryRepository.existsByUserIdAndBankCodeAndAccountNumber(userId, "BCA", "1234567890"))
                .thenReturn(false);
        when(transferRepository.existsTransferToDestination(userId, "BCA", "1234567890")).thenReturn(false);

        assertThatThrownBy(() -> service.create(userId, request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "NO_PRIOR_TRANSFER");
        verify(beneficiaryRepository, never()).save(any());
    }

    @Test
    void createSavesWhenAPriorTransferExists() {
        when(beneficiaryRepository.existsByUserIdAndBankCodeAndAccountNumber(userId, "BCA", "1234567890"))
                .thenReturn(false);
        when(transferRepository.existsTransferToDestination(userId, "BCA", "1234567890")).thenReturn(true);
        when(beneficiaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = service.create(userId, request);

        assertThat(response.alias()).isEqualTo("Budi");
        assertThat(response.accountName()).isEqualTo("BUDI SETIAWAN");
    }

    @Test
    void createRejectsDuplicateDestination() {
        when(beneficiaryRepository.existsByUserIdAndBankCodeAndAccountNumber(userId, "BCA", "1234567890"))
                .thenReturn(true);

        assertThatThrownBy(() -> service.create(userId, request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("code", "BENEFICIARY_EXISTS");
    }

    @Test
    void deletingAnotherUsersBeneficiaryYieldsNotFound() {
        UUID beneficiaryId = UUID.randomUUID();
        when(beneficiaryRepository.findByIdAndUserId(beneficiaryId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(userId, beneficiaryId))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }
}
