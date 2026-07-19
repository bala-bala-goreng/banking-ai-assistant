import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { errorMessage } from '../../api/client';
import { accountApi, BANKS, transferApi } from '../../api/endpoints';
import { TransferMethod } from '../../api/types';
import { AccountPicker } from '../../components/AccountPicker';
import { Chip } from '../../components/Chip';
import { ConfirmSheet } from '../../components/ConfirmSheet';
import { FormField } from '../../components/FormField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { colors, radius, spacing } from '../../theme';
import { digitsOnly, formatIDR } from '../../utils/format';
import { TransferStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<TransferStackParamList, 'TransferForm'>;

const METHOD_LABELS: Record<TransferMethod, string> = {
  BI_FAST: 'BI-FAST',
  ONLINE: 'Online Transfer',
  RTGS: 'RTGS',
};

export function TransferFormScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const prefill = route.params?.prefill;
  const intentId = route.params?.intentId;

  const [sourceAccountId, setSourceAccountId] = useState<string | null>(null);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<TransferMethod | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [intentNotice, setIntentNotice] = useState<string | null>(null);

  const amount = Number(amountText || '0');

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountApi.list });
  const accounts = accountsQuery.data ?? [];

  const firstAccountId = accountsQuery.data?.[0]?.id;

  // Default source account: first account once loaded.
  useEffect(() => {
    if (!sourceAccountId && firstAccountId) {
      setSourceAccountId(firstAccountId);
    }
  }, [firstAccountId, sourceAccountId]);

  // Prefill from a favorite (Favorites screen navigates here with params).
  useEffect(() => {
    if (prefill) {
      if (prefill.destBankCode) setBankCode(prefill.destBankCode);
      if (prefill.destAccountNumber) setAccountNumber(prefill.destAccountNumber);
      if (prefill.destAccountName) setAccountName(prefill.destAccountName);
      if (prefill.amount) setAmountText(String(prefill.amount));
      if (prefill.note) setNote(prefill.note);
    }
  }, [prefill]);

  // Assistant deeplink: bankapp://transfer?intentId=... — the intents endpoint
  // ships with the AI phases; until then this degrades to a friendly notice.
  useEffect(() => {
    if (!intentId) {
      return;
    }
    let cancelled = false;
    transferApi
      .intent(intentId)
      .then(intent => {
        if (cancelled) {
          return;
        }
        const p = intent.payload;
        if (p.destBankCode) setBankCode(p.destBankCode);
        if (p.destAccountNumber) setAccountNumber(p.destAccountNumber);
        if (p.destAccountName) setAccountName(p.destAccountName);
        if (p.amount) setAmountText(String(p.amount));
        if (p.method) setMethod(p.method as TransferMethod);
        if (p.sourceAccountId) setSourceAccountId(p.sourceAccountId);
      })
      .catch(() => {
        if (!cancelled) {
          setIntentNotice('Draft dari Asisten tidak tersedia. Isi formulir secara manual.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [intentId]);

  const optionsQuery = useQuery({
    queryKey: ['transfer-options', amount],
    queryFn: () => transferApi.options(amount),
    enabled: amount >= 1,
  });
  const options = optionsQuery.data ?? [];
  const selectedOption = options.find(o => o.method === method) ?? null;

  // Deselect a method that is no longer eligible after the amount changed.
  const loadedOptions = optionsQuery.data;
  useEffect(() => {
    if (method && loadedOptions && loadedOptions.length > 0 && !loadedOptions.some(o => o.method === method)) {
      setMethod(null);
    }
  }, [loadedOptions, method]);

  const executeMutation = useMutation({
    mutationFn: transferApi.execute,
    onSuccess: receipt => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setConfirmVisible(false);
      navigation.replace('TransferReceiptScreen', { receipt });
    },
  });

  const formValid =
    !!sourceAccountId && !!bankCode && accountNumber.length >= 6 && accountName.trim().length > 0 &&
    amount > 0 && !!selectedOption;

  const bankName = BANKS.find(b => b.code === bankCode)?.name ?? bankCode;

  return (
    <Screen>
      {intentNotice ? <Text style={styles.notice}>{intentNotice}</Text> : null}

      <AccountPicker
        accounts={accounts}
        selectedId={sourceAccountId}
        onSelect={setSourceAccountId}
      />

      <Text style={styles.label}>Bank tujuan</Text>
      <View style={styles.chips}>
        {BANKS.map(bank => (
          <Chip
            key={bank.code}
            label={bank.name}
            selected={bank.code === bankCode}
            onPress={() => setBankCode(bank.code)}
          />
        ))}
      </View>

      <FormField
        label="Nomor rekening tujuan"
        value={accountNumber}
        onChangeText={t => setAccountNumber(digitsOnly(t))}
        keyboardType="number-pad"
        maxLength={30}
        placeholder="1234567890"
      />
      <FormField
        label="Nama penerima"
        value={accountName}
        onChangeText={setAccountName}
        autoCapitalize="words"
        maxLength={100}
        placeholder="Budi Santoso"
      />
      <FormField
        label="Nominal"
        value={amountText}
        onChangeText={t => setAmountText(digitsOnly(t))}
        keyboardType="number-pad"
        placeholder="15000"
        helper={amount > 0 ? formatIDR(amount) : undefined}
      />
      <FormField label="Catatan (opsional)" value={note} onChangeText={setNote} maxLength={200} />

      {amount >= 1 && (
        <View style={styles.methods}>
          <Text style={styles.label}>Metode transfer</Text>
          {optionsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : optionsQuery.isError ? (
            <Text style={styles.error}>{errorMessage(optionsQuery.error)}</Text>
          ) : options.length === 0 ? (
            <Text style={styles.error}>Tidak ada metode yang tersedia untuk nominal ini.</Text>
          ) : (
            options.map(option => {
              const selected = option.method === method;
              return (
                <TouchableOpacity
                  key={option.method}
                  style={[styles.methodItem, selected && styles.methodSelected]}
                  onPress={() => setMethod(option.method)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.methodName}>{METHOD_LABELS[option.method]}</Text>
                    <Text style={styles.methodLimits}>
                      Min {formatIDR(option.minAmount)}
                      {option.maxAmount ? ` · Maks ${formatIDR(option.maxAmount)}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.methodFee, selected && styles.methodFeeSelected]}>
                    {formatIDR(option.fee)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      <PrimaryButton
        title="Lanjut"
        onPress={() => {
          executeMutation.reset();
          setConfirmVisible(true);
        }}
        disabled={!formValid}
        style={styles.submit}
      />

      <ConfirmSheet
        visible={confirmVisible}
        title="Konfirmasi Transfer"
        rows={[
          { label: 'Penerima', value: accountName },
          { label: 'Bank', value: `${bankName} · ${accountNumber}` },
          { label: 'Metode', value: method ? METHOD_LABELS[method] : '-' },
          { label: 'Nominal', value: formatIDR(amount) },
          { label: 'Biaya', value: formatIDR(selectedOption?.fee ?? 0) },
          { label: 'Total', value: formatIDR(amount + (selectedOption?.fee ?? 0)), emphasize: true },
        ]}
        loading={executeMutation.isPending}
        error={executeMutation.isError ? errorMessage(executeMutation.error) : null}
        onConfirm={pin =>
          executeMutation.mutate({
            sourceAccountId: sourceAccountId!,
            destBankCode: bankCode,
            destAccountNumber: accountNumber,
            destAccountName: accountName.trim(),
            amount,
            method: method!,
            note: note.trim() || undefined,
            pin,
          })
        }
        onClose={() => setConfirmVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    fontSize: 13,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  methods: { marginBottom: spacing.md },
  methodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  methodSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  methodName: { fontSize: 15, fontWeight: '600', color: colors.text },
  methodLimits: { fontSize: 12, color: colors.muted, marginTop: 2 },
  methodFee: { fontSize: 14, fontWeight: '700', color: colors.muted },
  methodFeeSelected: { color: colors.primaryDark },
  error: { color: colors.danger, marginBottom: spacing.sm },
  submit: { marginTop: spacing.sm, marginBottom: spacing.xl },
});
