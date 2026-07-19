import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { errorMessage } from '../../api/client';
import { accountApi, paymentApi } from '../../api/endpoints';
import { Inquiry } from '../../api/types';
import { AccountPicker } from '../../components/AccountPicker';
import { ConfirmSheet } from '../../components/ConfirmSheet';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { colors, radius, shadow, spacing } from '../../theme';
import { digitsOnly, formatIDR } from '../../utils/format';
import { PaymentStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PaymentStackParamList, 'Indihome'>;

/** IndiHome: inquiry → confirm (bill detail + fee) → pay with PIN (README §5.3). */
export function IndihomeScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [customerNumber, setCustomerNumber] = useState('');
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [sourceAccountId, setSourceAccountId] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountApi.list });
  const accounts = accountsQuery.data ?? [];
  const firstAccountId = accountsQuery.data?.[0]?.id;

  useEffect(() => {
    if (!sourceAccountId && firstAccountId) {
      setSourceAccountId(firstAccountId);
    }
  }, [firstAccountId, sourceAccountId]);

  const inquiryMutation = useMutation({
    mutationFn: () => paymentApi.inquiry({ biller: 'INDIHOME', customerNumber }),
    onSuccess: setInquiry,
  });

  const payMutation = useMutation({
    mutationFn: (pin: string) =>
      paymentApi.pay({
        biller: 'INDIHOME',
        inquiryId: inquiry!.inquiryId,
        sourceAccountId: sourceAccountId!,
        pin,
      }),
    onSuccess: receipt => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setConfirmVisible(false);
      navigation.replace('PaymentReceiptScreen', { receipt });
    },
  });

  return (
    <Screen>
      <FormField
        label="Nomor pelanggan IndiHome"
        value={customerNumber}
        onChangeText={t => {
          setCustomerNumber(digitsOnly(t));
          setInquiry(null);
        }}
        keyboardType="number-pad"
        maxLength={30}
        placeholder="122xxxxxxxx"
      />

      {!inquiry && (
        <>
          {inquiryMutation.isError ? (
            <Text style={styles.error}>{errorMessage(inquiryMutation.error)}</Text>
          ) : null}
          <PrimaryButton
            title="Cek Tagihan"
            onPress={() => inquiryMutation.mutate()}
            loading={inquiryMutation.isPending}
            disabled={customerNumber.length < 6}
          />
        </>
      )}

      {inquiry && (
        <>
          <View style={styles.bill}>
            <Text style={styles.billTitle}>Tagihan ditemukan</Text>
            <BillRow label="Nama" value={inquiry.customerName} />
            <BillRow label="Periode" value={inquiry.period} />
            <BillRow label="Tagihan" value={formatIDR(inquiry.amount)} />
            <BillRow label="Biaya admin" value={formatIDR(inquiry.fee)} />
            <BillRow label="Total" value={formatIDR(inquiry.amount + inquiry.fee)} emphasize />
          </View>

          <AccountPicker
            accounts={accounts}
            selectedId={sourceAccountId}
            onSelect={setSourceAccountId}
          />

          <PrimaryButton
            title="Bayar"
            onPress={() => {
              payMutation.reset();
              setConfirmVisible(true);
            }}
            disabled={!sourceAccountId}
          />
        </>
      )}

      <ConfirmSheet
        visible={confirmVisible}
        title="Konfirmasi Pembayaran"
        rows={
          inquiry
            ? [
                { label: 'Layanan', value: 'IndiHome' },
                { label: 'Pelanggan', value: `${inquiry.customerName} · ${inquiry.customerNumber}` },
                { label: 'Periode', value: inquiry.period },
                { label: 'Tagihan', value: formatIDR(inquiry.amount) },
                { label: 'Biaya', value: formatIDR(inquiry.fee) },
                { label: 'Total', value: formatIDR(inquiry.amount + inquiry.fee), emphasize: true },
              ]
            : []
        }
        loading={payMutation.isPending}
        error={payMutation.isError ? errorMessage(payMutation.error) : null}
        onConfirm={pin => payMutation.mutate(pin)}
        onClose={() => setConfirmVisible(false)}
      />
    </Screen>
  );
}

function BillRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, emphasize && styles.rowEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: spacing.sm },
  bill: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  billTitle: { fontSize: 15, fontWeight: '700', color: colors.success, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '500' },
  rowEmphasis: { fontWeight: '700', color: colors.primaryDark },
});
