import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { errorMessage } from '../../api/client';
import { BANKS, beneficiaryApi } from '../../api/endpoints';
import { Screen } from '../../components/Screen';
import { colors, radius, shadow, spacing } from '../../theme';
import { TransferStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<TransferStackParamList, 'Favorites'>;

export function FavoritesScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['beneficiaries'], queryFn: beneficiaryApi.list });

  const deleteMutation = useMutation({
    mutationFn: beneficiaryApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beneficiaries'] }),
  });

  const confirmDelete = (id: string, alias: string) => {
    Alert.alert('Hapus Favorit', `Hapus "${alias}" dari favorit?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <Screen padded={false} scroll={false}>
      {query.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : query.isError ? (
        <Text style={styles.error}>{errorMessage(query.error)}</Text>
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={b => b.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Belum ada favorit.{'\n'}Favorit dapat disimpan setelah transfer pertama ke tujuan
              baru berhasil.
            </Text>
          }
          renderItem={({ item }) => {
            const bankName = BANKS.find(b => b.code === item.bankCode)?.name ?? item.bankCode;
            return (
              <TouchableOpacity
                style={styles.item}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('TransferForm', {
                    prefill: {
                      destBankCode: item.bankCode,
                      destAccountNumber: item.accountNumber,
                      destAccountName: item.accountName,
                    },
                  })
                }
                onLongPress={() => confirmDelete(item.id, item.alias)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.alias.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.alias}>{item.alias}</Text>
                  <Text style={styles.detail}>
                    {item.accountName} · {bankName} {item.accountNumber}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(item.id, item.alias)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 20 },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.xl },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.primaryDark },
  itemBody: { flex: 1 },
  alias: { fontSize: 15, fontWeight: '600', color: colors.text },
  detail: { fontSize: 12, color: colors.muted, marginTop: 2 },
  deleteIcon: { fontSize: 16 },
});
