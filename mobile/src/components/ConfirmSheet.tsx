import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

export interface SummaryRow {
  label: string;
  value: string;
  emphasize?: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  rows: SummaryRow[];
  loading?: boolean;
  error?: string | null;
  onConfirm: (pin: string) => void;
  onClose: () => void;
}

const PIN_LENGTH = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/**
 * Bottom-sheet confirmation: summary rows + 6-digit PIN pad (README §4:
 * "confirmation always uses a bottom-sheet with fee breakdown + PIN pad").
 * Auto-submits when the 6th digit is entered.
 */
export function ConfirmSheet({ visible, title, rows, loading, error, onConfirm, onClose }: Props) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (visible) {
      setPin('');
    }
  }, [visible]);

  useEffect(() => {
    if (error) {
      setPin('');
    }
  }, [error]);

  const press = (key: string) => {
    if (loading) {
      return;
    }
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (!key || pin.length >= PIN_LENGTH) {
      return;
    }
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      onConfirm(next);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>

        <View style={styles.summary}>
          {rows.map(row => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={[styles.rowValue, row.emphasize && styles.rowEmphasis]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.pinLabel}>{loading ? 'Memproses…' : 'Masukkan PIN transaksi'}</Text>
        <View style={styles.dots}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.pad}>
          {KEYS.map((key, i) => (
            <TouchableOpacity
              key={i}
              style={styles.key}
              onPress={() => press(key)}
              disabled={!key || loading}
              activeOpacity={0.6}
            >
              <Text style={styles.keyLabel}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  summary: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  rowEmphasis: { fontWeight: '700', color: colors.primaryDark },
  pinLabel: { textAlign: 'center', color: colors.muted, marginBottom: spacing.sm },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: spacing.sm },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dotFilled: { backgroundColor: colors.primary },
  error: { textAlign: 'center', color: colors.danger, marginBottom: spacing.sm },
  pad: { flexDirection: 'row', flexWrap: 'wrap' },
  key: {
    width: '33.33%',
    paddingVertical: spacing.sm + 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: { fontSize: 24, fontWeight: '500', color: colors.text },
});
