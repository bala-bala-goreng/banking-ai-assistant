import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Transaction } from '../api/types';
import { colors, spacing } from '../theme';
import { formatDateTime, formatIDR } from '../utils/format';

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isDebit = transaction.direction === 'DEBIT';
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || transaction.category}
        </Text>
        <Text style={styles.meta}>{formatDateTime(transaction.createdAt)}</Text>
      </View>
      <Text style={[styles.amount, isDebit ? styles.debit : styles.credit]}>
        {isDebit ? '-' : '+'}
        {formatIDR(transaction.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  left: { flex: 1, marginRight: spacing.sm },
  description: { fontSize: 14, fontWeight: '500', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '700' },
  debit: { color: colors.text },
  credit: { color: colors.success },
});
