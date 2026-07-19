/**
 * Mirrors the backend DTOs (backend/src/main/java/com/bankapp/**).
 * BigDecimal fields arrive as JSON numbers; UUID/OffsetDateTime as strings.
 */

export type AccountType = 'SAVINGS' | 'PAYROLL' | 'BUSINESS';
export type TransferMethod = 'BI_FAST' | 'ONLINE' | 'RTGS';
export type Biller = 'INDIHOME' | 'GOPAY';
export type Direction = 'DEBIT' | 'CREDIT';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface Account {
  id: string;
  accountNumber: string;
  maskedNumber: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  status: string;
}

export interface Transaction {
  id: string;
  direction: Direction;
  amount: number;
  fee: number;
  category: string;
  refNo: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TransferOption {
  method: TransferMethod;
  fee: number;
  minAmount: number;
  maxAmount: number | null;
}

export interface TransferRequest {
  sourceAccountId: string;
  destBankCode: string;
  destAccountNumber: string;
  destAccountName: string;
  amount: number;
  method: TransferMethod;
  note?: string;
  pin: string;
}

export interface TransferReceipt {
  transferId: string;
  refNo: string;
  method: TransferMethod;
  destBankCode: string;
  destAccountNumber: string;
  destAccountName: string;
  amount: number;
  fee: number;
  balanceAfter: number;
  newDestination: boolean;
  createdAt: string;
}

export interface InquiryRequest {
  biller: Biller;
  customerNumber: string;
}

export interface Inquiry {
  inquiryId: string;
  biller: Biller;
  customerNumber: string;
  customerName: string;
  period: string;
  amount: number;
  fee: number;
  expiresAt: string;
}

export interface PaymentRequest {
  biller: Biller;
  inquiryId?: string;
  customerNumber?: string;
  amount?: number;
  sourceAccountId: string;
  pin: string;
}

export interface PaymentReceipt {
  paymentId: string;
  refNo: string;
  biller: Biller;
  customerNumber: string;
  customerName: string | null;
  period: string | null;
  amount: number;
  fee: number;
  balanceAfter: number;
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  alias: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
}

export interface CreateBeneficiaryRequest {
  alias: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

/**
 * Transfer/payment intent drafted by the AI Assistant (README §6.4).
 * The backend endpoint (GET /transfers/intents/{id}) lands with the AI phases;
 * the deeplink route is wired now so bankapp://transfer?intentId=... already resolves.
 */
export interface TransferIntent {
  id: string;
  kind: 'TRANSFER' | 'PAYMENT';
  status: 'DRAFT' | 'EXECUTED' | 'EXPIRED';
  payload: Partial<TransferRequest> & Partial<PaymentRequest>;
  expiresAt: string;
}
