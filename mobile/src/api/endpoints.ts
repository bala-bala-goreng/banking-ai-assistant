import { api } from './client';
import {
  Account,
  Beneficiary,
  CreateBeneficiaryRequest,
  Inquiry,
  InquiryRequest,
  PageResponse,
  PaymentReceipt,
  PaymentRequest,
  TokenResponse,
  Transaction,
  TransferIntent,
  TransferOption,
  TransferReceipt,
  TransferRequest,
} from './types';

export const authApi = {
  login: (username: string, password: string) =>
    api.post<TokenResponse>('/api/v1/auth/login', { username, password }).then(r => r.data),
};

export const accountApi = {
  list: () => api.get<Account[]>('/api/v1/accounts').then(r => r.data),
  transactions: (accountId: string, page = 0, size = 20) =>
    api
      .get<PageResponse<Transaction>>(`/api/v1/accounts/${accountId}/transactions`, {
        params: { page, size },
      })
      .then(r => r.data),
};

export const transferApi = {
  options: (amount: number) =>
    api.get<TransferOption[]>('/api/v1/transfers/options', { params: { amount } }).then(r => r.data),
  execute: (request: TransferRequest) =>
    api.post<TransferReceipt>('/api/v1/transfers', request).then(r => r.data),
  // Available once the AI phases add assistant-drafted intents (README §6.4).
  intent: (intentId: string) =>
    api.get<TransferIntent>(`/api/v1/transfers/intents/${intentId}`).then(r => r.data),
};

export const paymentApi = {
  inquiry: (request: InquiryRequest) =>
    api.post<Inquiry>('/api/v1/payments/inquiry', request).then(r => r.data),
  pay: (request: PaymentRequest) =>
    api.post<PaymentReceipt>('/api/v1/payments', request).then(r => r.data),
};

export const beneficiaryApi = {
  list: () => api.get<Beneficiary[]>('/api/v1/beneficiaries').then(r => r.data),
  create: (request: CreateBeneficiaryRequest) =>
    api.post<Beneficiary>('/api/v1/beneficiaries', request).then(r => r.data),
  remove: (id: string) => api.delete(`/api/v1/beneficiaries/${id}`).then(() => undefined),
};

/** Static bank list for the transfer form (prototype). */
export const BANKS: { code: string; name: string }[] = [
  { code: 'BCA', name: 'BCA' },
  { code: 'BNI', name: 'BNI' },
  { code: 'BRI', name: 'BRI' },
  { code: 'MANDIRI', name: 'Mandiri' },
  { code: 'PERMATA', name: 'Permata' },
  { code: 'CIMB', name: 'CIMB Niaga' },
];
