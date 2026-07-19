import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { colors, radius, shadow, spacing } from '../../theme';

/**
 * Placeholder — the agentic assistant (chat + SSE streaming + deeplinks) lands
 * with the AI phases (README §6). The tab exists now so navigation, deeplinks,
 * and layout are final.
 */
export function AssistantScreen() {
  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>🤖</Text>
        </View>
        <Text style={styles.title}>Asisten AI</Text>
        <Text style={styles.body}>
          Segera hadir! Asisten akan membantu Anda mengecek saldo, melihat transaksi, dan
          menyiapkan transfer atau pembayaran — cukup dengan chat.
        </Text>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Contoh yang akan didukung:</Text>
          <Text style={styles.example}>"Berapa saldo saya?"</Text>
          <Text style={styles.example}>"Transfer ke Budi 15.000"</Text>
          <Text style={styles.example}>"Bayar tagihan IndiHome"</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badgeIcon: { fontSize: 44 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  body: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  exampleCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignSelf: 'stretch',
    ...shadow.card,
  },
  exampleTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  example: { fontSize: 14, color: colors.primaryDark, marginBottom: spacing.xs, fontStyle: 'italic' },
});
