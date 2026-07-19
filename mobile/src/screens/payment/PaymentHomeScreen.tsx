import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { colors, radius, shadow, spacing } from '../../theme';
import { PaymentStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentHome'>;

export function PaymentHomeScreen({ navigation, route }: Props) {
  const intentId = route.params?.intentId;
  const [intentNotice, setIntentNotice] = useState<string | null>(null);

  // Assistant deeplink target (bankapp://payment?intentId=...). Prefill from the
  // intent arrives with the AI phases; until then show a notice and let the user
  // continue manually.
  useEffect(() => {
    if (intentId) {
      setIntentNotice('Draft pembayaran dari Asisten belum tersedia. Silakan lanjutkan manual.');
    }
  }, [intentId]);

  return (
    <Screen>
      {intentNotice ? <Text style={styles.notice}>{intentNotice}</Text> : null}
      <Text style={styles.heading}>Pilih layanan</Text>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Indihome')}
      >
        <View style={[styles.icon, styles.iconIndihome]}>
          <Text style={styles.iconText}>📡</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>IndiHome</Text>
          <Text style={styles.cardSubtitle}>Cek & bayar tagihan bulanan</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Gopay')}
      >
        <View style={[styles.icon, styles.iconGopay]}>
          <Text style={styles.iconText}>💳</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>GoPay</Text>
          <Text style={styles.cardSubtitle}>Top-up saldo e-wallet</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
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
  heading: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconIndihome: { backgroundColor: '#FEE2E2' },
  iconGopay: { backgroundColor: '#DBEAFE' },
  iconText: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.muted },
});
