import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { errorMessage } from '../../api/client';
import { BANKS, beneficiaryApi } from '../../api/endpoints';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ReceiptView } from '../../components/ReceiptView';
import { Screen } from '../../components/Screen';
import { colors, radius, shadow, spacing } from '../../theme';
import { formatDateTime, formatIDR } from '../../utils/format';
import { TransferStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<TransferStackParamList, 'TransferReceiptScreen'>;

const METHOD_LABELS: Record<string, string> = {
  BI_FAST: 'BI-FAST',
  ONLINE: 'Online Transfer',
  RTGS: 'RTGS',
};

export function TransferReceiptScreen({ navigation, route }: Props) {
  const { receipt } = route.params;
  const queryClient = useQueryClient();
  const [alias, setAlias] = useState(receipt.destAccountName);
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      beneficiaryApi.create({
        alias: alias.trim(),
        bankCode: receipt.destBankCode,
        accountNumber: receipt.destAccountNumber,
        accountName: receipt.destAccountName,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      setSaved(true);
    },
  });

  const bankName = BANKS.find(b => b.code === receipt.destBankCode)?.name ?? receipt.destBankCode;

  return (
    <Screen>
      <ReceiptView
        refNo={receipt.refNo}
        amount={formatIDR(receipt.amount)}
        rows={[
          { label: 'Penerima', value: receipt.destAccountName },
          { label: 'Bank', value: `${bankName} · ${receipt.destAccountNumber}` },
          { label: 'Metode', value: METHOD_LABELS[receipt.method] ?? receipt.method },
          { label: 'Biaya', value: formatIDR(receipt.fee) },
          { label: 'Saldo akhir', value: formatIDR(receipt.balanceAfter) },
          { label: 'Waktu', value: formatDateTime(receipt.createdAt) },
        ]}
      />

      {receipt.newDestination && !saved && (
        <View style={styles.favoriteCard}>
          <Text style={styles.favoriteTitle}>💾 Simpan ke Favorit?</Text>
          <Text style={styles.favoriteHint}>
            Tujuan baru — simpan agar bisa dipakai lagi (dan dikenali Asisten).
          </Text>
          <FormField label="Alias" value={alias} onChangeText={setAlias} maxLength={50} />
          {saveMutation.isError ? (
            <Text style={styles.error}>{errorMessage(saveMutation.error)}</Text>
          ) : null}
          <PrimaryButton
            title="Simpan Favorit"
            onPress={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!alias.trim()}
          />
        </View>
      )}
      {saved && <Text style={styles.savedText}>⭐ Tersimpan di Favorit</Text>}

      <PrimaryButton
        title="Selesai"
        variant="outline"
        onPress={() => navigation.popToTop()}
        style={styles.done}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  favoriteCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  favoriteTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  favoriteHint: { fontSize: 13, color: colors.muted, marginVertical: spacing.sm },
  savedText: {
    textAlign: 'center',
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  error: { color: colors.danger, marginBottom: spacing.sm },
  done: { marginTop: spacing.md, marginBottom: spacing.xl },
});
