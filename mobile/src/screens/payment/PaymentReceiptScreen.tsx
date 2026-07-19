import React from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ReceiptView } from '../../components/ReceiptView';
import { Screen } from '../../components/Screen';
import { spacing } from '../../theme';
import { formatDateTime, formatIDR } from '../../utils/format';
import { PaymentStackParamList } from '../../navigation/types';
import { SummaryRow } from '../../components/ConfirmSheet';

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentReceiptScreen'>;

export function PaymentReceiptScreen({ navigation, route }: Props) {
  const { receipt } = route.params;
  const isIndihome = receipt.biller === 'INDIHOME';

  const rows: SummaryRow[] = [
    { label: 'Layanan', value: isIndihome ? 'IndiHome' : 'GoPay' },
    {
      label: isIndihome ? 'Pelanggan' : 'Nomor HP',
      value: receipt.customerName
        ? `${receipt.customerName} · ${receipt.customerNumber}`
        : receipt.customerNumber,
    },
  ];
  if (receipt.period) {
    rows.push({ label: 'Periode', value: receipt.period });
  }
  rows.push(
    { label: 'Biaya', value: formatIDR(receipt.fee) },
    { label: 'Saldo akhir', value: formatIDR(receipt.balanceAfter) },
    { label: 'Waktu', value: formatDateTime(receipt.createdAt) },
  );

  return (
    <Screen>
      <ReceiptView refNo={receipt.refNo} amount={formatIDR(receipt.amount)} rows={rows} />
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
  done: { marginTop: spacing.md, marginBottom: spacing.xl },
});
