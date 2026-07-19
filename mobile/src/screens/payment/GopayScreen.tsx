import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { errorMessage } from '../../api/client';
import { accountApi, paymentApi } from '../../api/endpoints';
import { AccountPicker } from '../../components/AccountPicker';
import { Chip } from '../../components/Chip';
import { ConfirmSheet } from '../../components/ConfirmSheet';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { spacing } from '../../theme';
import { digitsOnly, formatIDR } from '../../utils/format';
import { PaymentStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PaymentStackParamList, 'Gopay'>;

// Matches Biller.GOPAY on the backend; the authoritative fee is on the receipt.
const GOPAY_FEE = 1000;
const PRESETS = [50000, 100000, 200000, 500000];

/** GoPay: direct top-up — phone number + amount (README §5.3). */
export function GopayScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [amountText, setAmountText] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const amount = Number(amountText || '0');

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountApi.list });
  const accounts = accountsQuery.data ?? [];
  const firstAccountId = accountsQuery.data?.[0]?.id;

  useEffect(() => {
    if (!sourceAccountId && firstAccountId) {
      setSourceAccountId(firstAccountId);
    }
  }, [firstAccountId, sourceAccountId]);

  const payMutation = useMutation({
    mutationFn: (pin: string) =>
      paymentApi.pay({
        biller: 'GOPAY',
        customerNumber: phone,
        amount,
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

  const valid = phone.length >= 9 && amount >= 10000 && !!sourceAccountId;

  return (
    <Screen>
      <FormField
        label="Nomor HP tujuan"
        value={phone}
        onChangeText={t => setPhone(digitsOnly(t))}
        keyboardType="phone-pad"
        maxLength={30}
        placeholder="0812xxxxxxxx"
      />
      <FormField
        label="Nominal top-up"
        value={amountText}
        onChangeText={t => setAmountText(digitsOnly(t))}
        keyboardType="number-pad"
        placeholder="50000"
        helper={amount > 0 ? formatIDR(amount) : 'Minimal Rp10.000'}
      />
      <View style={styles.presets}>
        {PRESETS.map(preset => (
          <Chip
            key={preset}
            label={formatIDR(preset)}
            selected={amount === preset}
            onPress={() => setAmountText(String(preset))}
          />
        ))}
      </View>

      <AccountPicker
        accounts={accounts}
        selectedId={sourceAccountId}
        onSelect={setSourceAccountId}
      />

      <PrimaryButton
        title="Top-up"
        onPress={() => {
          payMutation.reset();
          setConfirmVisible(true);
        }}
        disabled={!valid}
      />

      <ConfirmSheet
        visible={confirmVisible}
        title="Konfirmasi Top-up"
        rows={[
          { label: 'Layanan', value: 'GoPay' },
          { label: 'Nomor HP', value: phone },
          { label: 'Nominal', value: formatIDR(amount) },
          { label: 'Biaya', value: formatIDR(GOPAY_FEE) },
          { label: 'Total', value: formatIDR(amount + GOPAY_FEE), emphasize: true },
        ]}
        loading={payMutation.isPending}
        error={payMutation.isError ? errorMessage(payMutation.error) : null}
        onConfirm={pin => payMutation.mutate(pin)}
        onClose={() => setConfirmVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  presets: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
});
