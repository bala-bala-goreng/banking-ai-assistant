import { NavigatorScreenParams } from '@react-navigation/native';
import { PaymentReceipt, TransferReceipt } from '../api/types';

/** Prefill for the transfer form — from a favorite or an assistant intent. */
export interface TransferPrefill {
  destBankCode?: string;
  destAccountNumber?: string;
  destAccountName?: string;
  amount?: number;
  note?: string;
}

export type HomeStackParamList = {
  Home: undefined;
  AccountDetail: { accountId: string; maskedNumber: string };
};

export type PaymentStackParamList = {
  PaymentHome: { intentId?: string } | undefined;
  Indihome: undefined;
  Gopay: undefined;
  PaymentReceiptScreen: { receipt: PaymentReceipt };
};

export type TransferStackParamList = {
  TransferForm: { prefill?: TransferPrefill; intentId?: string } | undefined;
  TransferReceiptScreen: { receipt: TransferReceipt };
  Favorites: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  PaymentTab: NavigatorScreenParams<PaymentStackParamList>;
  TransferTab: NavigatorScreenParams<TransferStackParamList>;
  AssistantTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};
