import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DEEPLINK_SCHEME } from '../config';
import { useAuthStore } from '../store/auth';
import { colors } from '../theme';
import { AccountDetailScreen } from '../screens/home/AccountDetailScreen';
import { AssistantScreen } from '../screens/assistant/AssistantScreen';
import { FavoritesScreen } from '../screens/transfer/FavoritesScreen';
import { GopayScreen } from '../screens/payment/GopayScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { IndihomeScreen } from '../screens/payment/IndihomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PaymentHomeScreen } from '../screens/payment/PaymentHomeScreen';
import { PaymentReceiptScreen } from '../screens/payment/PaymentReceiptScreen';
import { TransferFormScreen } from '../screens/transfer/TransferFormScreen';
import { TransferReceiptScreen } from '../screens/transfer/TransferReceiptScreen';
import {
  HomeStackParamList,
  MainTabParamList,
  PaymentStackParamList,
  RootStackParamList,
  TransferStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const PaymentStack = createNativeStackNavigator<PaymentStackParamList>();
const TransferStack = createNativeStackNavigator<TransferStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' as const },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen
        name="AccountDetail"
        component={AccountDetailScreen}
        options={{ title: 'Detail Rekening' }}
      />
    </HomeStack.Navigator>
  );
}

function PaymentStackNavigator() {
  return (
    <PaymentStack.Navigator screenOptions={stackScreenOptions}>
      <PaymentStack.Screen
        name="PaymentHome"
        component={PaymentHomeScreen}
        options={{ title: 'Pembayaran' }}
      />
      <PaymentStack.Screen name="Indihome" component={IndihomeScreen} options={{ title: 'IndiHome' }} />
      <PaymentStack.Screen name="Gopay" component={GopayScreen} options={{ title: 'GoPay Top-up' }} />
      <PaymentStack.Screen
        name="PaymentReceiptScreen"
        component={PaymentReceiptScreen}
        options={{ title: 'Bukti Pembayaran', headerBackVisible: false }}
      />
    </PaymentStack.Navigator>
  );
}

function TransferStackNavigator() {
  return (
    <TransferStack.Navigator screenOptions={stackScreenOptions}>
      <TransferStack.Screen
        name="TransferForm"
        component={TransferFormScreen}
        options={{ title: 'Transfer' }}
      />
      <TransferStack.Screen
        name="TransferReceiptScreen"
        component={TransferReceiptScreen}
        options={{ title: 'Bukti Transfer', headerBackVisible: false }}
      />
      <TransferStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favorit' }}
      />
    </TransferStack.Navigator>
  );
}

function tabIcon(icon: string) {
  return ({ focused }: { focused: boolean; color: string; size: number }) => (
    <Text style={focused ? styles.tabIconFocused : styles.tabIcon}>{icon}</Text>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Beranda', tabBarIcon: tabIcon('🏠') }}
      />
      <Tabs.Screen
        name="PaymentTab"
        component={PaymentStackNavigator}
        options={{ title: 'Bayar', tabBarIcon: tabIcon('🧾') }}
      />
      <Tabs.Screen
        name="TransferTab"
        component={TransferStackNavigator}
        options={{ title: 'Transfer', tabBarIcon: tabIcon('💸') }}
      />
      <Tabs.Screen
        name="AssistantTab"
        component={AssistantScreen}
        options={{ title: 'Asisten', tabBarIcon: tabIcon('🤖') }}
      />
    </Tabs.Navigator>
  );
}

/**
 * Deeplinks (README §6.4):
 *   bankapp://transfer?intentId=ti_xxx → Transfer form (prefilled from intent)
 *   bankapp://payment?intentId=pi_xxx  → Payment home
 */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [DEEPLINK_SCHEME],
  config: {
    screens: {
      Main: {
        screens: {
          TransferTab: {
            screens: {
              TransferForm: 'transfer',
            },
          },
          PaymentTab: {
            screens: {
              PaymentHome: 'payment',
            },
          },
        },
      },
    },
  },
};

export function RootNavigator() {
  const status = useAuthStore(s => s.status);
  const hydrate = useAuthStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'signedIn' ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  tabIcon: { fontSize: 20, opacity: 0.55 },
  tabIconFocused: { fontSize: 20 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
