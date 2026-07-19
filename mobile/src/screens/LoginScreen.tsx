import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../api/client';
import { authApi } from '../api/endpoints';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAuthStore } from '../store/auth';
import { colors, radius, spacing } from '../theme';

export function LoginScreen() {
  const setTokens = useAuthStore(s => s.setTokens);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokens = await authApi.login(username.trim(), password);
      await setTokens(tokens);
      // RootNavigator switches to the tabs when status becomes signedIn.
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>B</Text>
        </View>
        <Text style={styles.title}>Banking AI Assistant</Text>
        <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>
      </View>

      <FormField
        label="Username"
        value={username}
        onChangeText={setUsername}
        placeholder="demo"
      />
      <FormField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        title="Masuk"
        onPress={login}
        loading={loading}
        disabled={!username.trim() || !password}
      />
      <Text style={styles.hint}>Demo: demo / password123 (PIN 123456)</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xl * 2, marginBottom: spacing.xl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: { fontSize: 40, fontWeight: '800', color: colors.white },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  hint: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: spacing.md },
});
