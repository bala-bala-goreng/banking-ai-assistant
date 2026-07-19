import { useInfiniteQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { errorMessage } from '../../api/client';
import { accountApi } from '../../api/endpoints';
import { Screen } from '../../components/Screen';
import { TransactionRow } from '../../components/TransactionRow';
import { colors, radius, shadow, spacing } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AccountDetail'>;

export function AccountDetailScreen({ route }: Props) {
  const { accountId, maskedNumber } = route.params;

  const query = useInfiniteQuery({
    queryKey: ['transactions', accountId],
    queryFn: ({ pageParam }) => accountApi.transactions(accountId, pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: last => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });

  const transactions = query.data?.pages.flatMap(p => p.content) ?? [];

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.card}>
        <Text style={styles.title}>Mutasi Rekening</Text>
        <Text style={styles.subtitle}>{maskedNumber}</Text>
        {query.isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : query.isError ? (
          <Text style={styles.error}>{errorMessage(query.error)}</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={t => t.id}
            renderItem={({ item }) => <TransactionRow transaction={item} />}
            onEndReached={() => query.hasNextPage && query.fetchNextPage()}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator color={colors.primary} style={styles.loader} />
              ) : null
            }
            ListEmptyComponent={<Text style={styles.empty}>Belum ada transaksi.</Text>}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    margin: spacing.md,
    padding: spacing.md,
    ...shadow.card,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted, marginBottom: spacing.sm },
  loader: { marginVertical: spacing.lg },
  error: { color: colors.danger, textAlign: 'center', marginVertical: spacing.lg },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: spacing.lg },
});
