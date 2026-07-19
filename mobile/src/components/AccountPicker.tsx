import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Account } from '../api/types';
import { colors, radius, spacing } from '../theme';
import { formatIDR } from '../utils/format';

interface Props {
  label?: string;
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Source-account selector: one tappable row per account. */
export function AccountPicker({ label = 'Rekening sumber', accounts, selectedId, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {accounts.map(account => {
        const selected = account.id === selectedId;
        return (
          <TouchableOpacity
            key={account.id}
            style={[styles.item, selected && styles.itemSelected]}
            onPress={() => onSelect(account.id)}
            activeOpacity={0.7}
          >
            <View style={styles.itemLeft}>
              <Text style={styles.type}>{account.accountType}</Text>
              <Text style={styles.number}>{account.maskedNumber}</Text>
            </View>
            <Text style={[styles.balance, selected && styles.balanceSelected]}>
              {formatIDR(account.balance)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  itemLeft: {},
  type: { fontSize: 14, fontWeight: '600', color: colors.text },
  number: { fontSize: 12, color: colors.muted, marginTop: 2 },
  balance: { fontSize: 14, fontWeight: '600', color: colors.muted },
  balanceSelected: { color: colors.primaryDark },
});
