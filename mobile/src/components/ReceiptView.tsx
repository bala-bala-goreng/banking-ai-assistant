import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';
import { SummaryRow } from './ConfirmSheet';

interface Props {
  refNo: string;
  amount: string;
  rows: SummaryRow[];
}

export function ReceiptView({ refNo, amount, rows }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeCheck}>✓</Text>
      </View>
      <Text style={styles.success}>Transaksi Berhasil</Text>
      <Text style={styles.amount}>{amount}</Text>
      <Text style={styles.refNo}>Ref: {refNo}</Text>
      <View style={styles.divider} />
      {rows.map(row => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.rowLabel}>{row.label}</Text>
          <Text style={[styles.rowValue, row.emphasize && styles.rowEmphasis]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badgeCheck: { fontSize: 28, color: colors.success, fontWeight: '700' },
  success: { fontSize: 16, fontWeight: '600', color: colors.success },
  amount: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
  refNo: { fontSize: 12, color: colors.muted, marginTop: spacing.xs },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  rowEmphasis: { fontWeight: '700', color: colors.primaryDark },
});
