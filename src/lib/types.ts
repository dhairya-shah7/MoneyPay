export interface Merchant {
  id: string;
  name: string;
  code: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  upiId?: string | null;
  dailyLimit: number;
  currentDayVolume: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpiAccount {
  id: string;
  upiId: string;
  payeeName: string;
  bankAccountId?: string | null; // Parent settlement bank account
  isGoogleBusiness?: boolean;
  gpayMerchantId?: string | null;
  terminalCode?: string | null;
  storeName?: string | null;
  qrImageUrl?: string | null;
  dailyLimit: number;
  currentDayVolume: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleBusinessAccount extends UpiAccount {
  isGoogleBusiness: true;
  gpayMerchantId?: string | null;
  terminalCode?: string | null;
  storeName?: string | null;
}

export type OrderStatus =
  | 'PENDING'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'BANK_MISMATCH'
  | 'DUPLICATE'
  | 'FAILED'
  | 'EXPIRED';

export interface PayinOrder {
  id: string;
  merchantId: string;
  merchantOrderId: string;
  userId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  amount: number;
  status: OrderStatus;
  
  assignedType?: 'UPI' | 'BANK' | null;
  assignedBankId?: string | null;
  assignedUpiId?: string | null;
  
  assignedUpiString?: string | null;
  assignedAccountNo?: string | null;
  assignedIfsc?: string | null;
  assignedHolder?: string | null;
  assignedBankName?: string | null;
  
  userSubmittedUtr?: string | null;
  bankUtr?: string | null;
  screenshotUrl?: string | null;
  receivedAmount?: number | null;
  
  disputeReason?: string | null;
  adminNotes?: string | null;
  expiresAt: string;
  paidAt?: string | null;
  
  webhookSent: boolean;
  webhookAttempts: number;
  webhookLastResponse?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  orderId: string;
  event: string;
  url: string;
  payload: string;
  responseStatus?: number | null;
  responseBody?: string | null;
  success: boolean;
  createdAt: string;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'OPERATIONS_AGENT'
  | 'FINANCE_VIEWER'
  | 'MERCHANT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  merchantId?: string | null;
  businessName?: string | null;
  dailyLimit?: number;
  currentDayVolume?: number;
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  expiresAt: string;
}

export interface DatabaseSchema {
  merchants: Merchant[];
  bankAccounts: BankAccount[];
  upiAccounts: UpiAccount[];
  orders: PayinOrder[];
  webhookLogs: WebhookLog[];
  users: User[];
  sessions: Session[];
}
