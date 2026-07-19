import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { errorMessage } from '../../api/client';
import { accountApi } from '../../api/endpoints';
import { Account } from '../../api/types';
import { Screen } from '../../components/Screen';
import { TransactionRow } from '../../components/TransactionRow';
import { useAuthStore } from '../../store/auth';
import { colors, radius, shadow, spacing } from '../../theme';
import { formatIDR } from '../../utils/format';
import { HomeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList>
>;

const CARD_WIDTH = Dimensions.get('window').width - spacing.md * 2 - spacing.lg;

export function HomeScreen({ navigation }: Props) {
  const logout = useAuthStore(s => s.logout);
  const [showBalance, setShowBalance] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountApi.list });
  const accounts = accountsQuery.data ?? [];
  const activeAccount: Account | undefined = accounts[activeIndex] ?? accounts[0];

  const recentQuery = useQuery({
    queryKey: ['transactions', activeAccount?.id, 'recent'],
    queryFn: () => accountApi.transactions(activeAccount!.id, 0, 5),
    enabled: !!activeAccount,
  });

  return (
    <Screen padded={false} scroll={false}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={accountsQuery.isRefetching}
            onRefresh={() => {
              accountsQuery.refetch();
              recentQuery.refetch();
            }}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Selamat datang 👋</Text>
            <Text style={styles.headerTitle}>Rekening Saya</Text>
          </View>
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logout}>Keluar</Text>
          </TouchableOpacity>
        </View>

        {accountsQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : accountsQuery.isError ? (
          <Text style={styles.error}>{errorMessage(accountsQuery.error)}</Text>
        ) : (
          <FlatList
            horizontal
            data={accounts}
            keyExtractor={a => a.id}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + spacing.sm}
            decelerationRate="fast"
            contentContainerStyle={styles.carousel}
            onMomentumScrollEnd={e => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + spacing.sm));
              setActiveIndex(Math.max(0, Math.min(index, accounts.length - 1)));
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AccountDetail', {
                    accountId: item.id,
                    maskedNumber: item.maskedNumber,
                  })
                }
              >
                <Text style={styles.cardType}>{item.accountType}</Text>
                <Text style={styles.cardNumber}>{item.maskedNumber}</Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.cardBalance}>
                    {showBalance ? formatIDR(item.balance) : 'Rp ••••••'}
                  </Text>
                  <TouchableOpacity
                    onPress={e => {
                      e.stopPropagation();
                      setShowBalance(v => !v);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.eye}>{showBalance ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.quickActions}>
          <QuickAction
            label="Transfer"
            icon="💸"
            onPress={() => navigation.navigate('TransferTab', { screen: 'TransferForm' })}
          />
          <QuickAction
            label="Bayar"
            icon="🧾"
            onPress={() => navigation.navigate('PaymentTab', { screen: 'PaymentHome' })}
          />
          <QuickAction
            label="Favorit"
            icon="⭐"
            onPress={() => navigation.navigate('TransferTab', { screen: 'Favorites' })}
          />
          <QuickAction
            label="Asisten"
            icon="🤖"
            onPress={() => navigation.navigate('AssistantTab')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
          {recentQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : recentQuery.data?.content.length ? (
            recentQuery.data.content.map(t => <TransactionRow key={t.id} transaction={t} />)
          ) : (
            <Text style={styles.empty}>Belum ada transaksi.</Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuickAction({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickIcon}>
        <Text style={styles.quickIconText}>{icon}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg,
  },
  greeting: { color: colors.primaryLight, fontSize: 13 },
  headerTitle: { color: colors.white, fontSize: 22, fontWeight: '700', marginTop: 2 },
  logout: { color: colors.white, fontSize: 13, fontWeight: '600' },
  carousel: { paddingHorizontal: spacing.md, marginTop: -spacing.xl, paddingBottom: spacing.xs },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginRight: spacing.sm,
    ...shadow.card,
  },
  cardType: { fontSize: 13, fontWeight: '700', color: colors.primary },
  cardNumber: { fontSize: 13, color: colors.muted, marginTop: 2 },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  cardBalance: { fontSize: 24, fontWeight: '800', color: colors.text },
  eye: { fontSize: 18 },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  quickAction: { alignItems: 'center' },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconText: { fontSize: 22 },
  quickLabel: { fontSize: 12, color: colors.text, marginTop: spacing.xs, fontWeight: '500' },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    margin: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  loader: { marginVertical: spacing.lg },
  error: { color: colors.danger, textAlign: 'center', margin: spacing.lg },
  empty: { color: colors.muted, paddingVertical: spacing.md, textAlign: 'center' },
});
