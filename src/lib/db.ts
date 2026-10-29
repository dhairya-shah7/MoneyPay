import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import {
  DatabaseSchema,
  Merchant,
  BankAccount,
  UpiAccount,
  PayinOrder,
  WebhookLog,
  User,
  Session,
  UserRole,
  OrderStatus,
} from './types';

// In serverless environments like Vercel/AWS Lambda, process.cwd() is read-only (/var/task).
// Use os.tmpdir() for local scratch persistence to avoid ENOENT errors.
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && (process.cwd().startsWith('/var/task') || process.cwd().startsWith('/var/runtime')))
);

const DATA_DIR = IS_SERVERLESS ? path.join(os.tmpdir(), 'moneypay_data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'moneypay_db.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_moneypay_salt_2026').digest('hex');
}

const DEFAULT_ADMIN_EMAIL = (process.env.INITIAL_ADMIN_EMAIL || 'admin@hunarpay.com').toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123';
const DEFAULT_ADMIN_NAME = process.env.INITIAL_ADMIN_NAME || 'Super Admin';

const INITIAL_SUPER_ADMIN_PASSWORD_HASH = hashPassword(DEFAULT_ADMIN_PASSWORD);

const INITIAL_DATA: DatabaseSchema = {
  merchants: [
    {
      id: 'merch_core_1',
      name: 'MoneyPay Core Gateway',
      code: 'MONEYPAY_MAIN',
      apiKey: 'mp_live_k928f01a89c20a1e3bf89',
      apiSecret: 'mp_sec_89df201ba873910c28479e0189',
      webhookUrl: 'http://localhost:3000/api/v1/admin/webhooks/test-receiver',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  bankAccounts: [
    {
      id: 'bank_kotak_1',
      bankName: 'Kotak Mahindra Bank',
      accountNumber: '9974366033',
      ifscCode: 'KKBK0002626',
      accountHolder: 'AGS',
      upiId: '9974366033@kotak',
      dailyLimit: 500000,
      currentDayVolume: 0,
      minAmount: 10,
      maxAmount: 200000,
      isActive: true,
      priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  upiAccounts: [
    {
      id: 'gbiz_gracy_sbi',
      upiId: 'gracyconstruction@sbi',
      payeeName: 'Gracy Construction',
      bankAccountId: 'bank_kotak_1',
      isGoogleBusiness: true,
      storeName: 'Gracy Construction Store',
      gpayMerchantId: 'GPAY_M_GRACY_01',
      terminalCode: 'TERM_01',
      dailyLimit: 500000,
      currentDayVolume: 0,
      minAmount: 10,
      maxAmount: 200000,
      isActive: true,
      priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'upi_kotak_1',
      upiId: '9974366033@kotak',
      payeeName: 'AGS',
      bankAccountId: 'bank_kotak_1',
      dailyLimit: 300000,
      currentDayVolume: 0,
      minAmount: 10,
      maxAmount: 100000,
      isActive: true,
      priority: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  orders: [],
  webhookLogs: [],
  users: [
    {
      id: 'usr_superadmin',
      email: DEFAULT_ADMIN_EMAIL,
      name: DEFAULT_ADMIN_NAME,
      role: 'SUPER_ADMIN',
      passwordHash: INITIAL_SUPER_ADMIN_PASSWORD_HASH,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_ops_agent_1',
      email: 'ops@moneypay.io',
      name: 'Operations Team Lead',
      role: 'OPERATIONS_AGENT',
      passwordHash: hashPassword('OpsAgent@2026'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  sessions: [],
};

class JsonDatabase {
  private cache: DatabaseSchema | null = null;

  private ensureFile(): DatabaseSchema {
    if (!this.cache) {
      this.cache = JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      } else {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.cache = JSON.parse(raw);
      }
    } catch (err) {
      // Graceful fallback in read-only / restricted environments
      console.warn('[DB] Running with in-memory persistence fallback:', err);
    }

    // Auto-migrate missing fields and remove old demo accounts
    let mutated = false;
    const hasDemoBank = this.cache!.bankAccounts?.some(
      (b) => b.accountNumber === '50200084729103' || b.accountNumber === '918020058392019'
    );
    if (!this.cache!.bankAccounts || this.cache!.bankAccounts.length === 0 || hasDemoBank) {
      this.cache!.bankAccounts = JSON.parse(JSON.stringify(INITIAL_DATA.bankAccounts));
      mutated = true;
    }

    const hasDemoUpi = this.cache!.upiAccounts?.some(
      (u) => u.upiId === 'moneypay@kotak' || u.upiId === 'moneypaypayin@yesbank'
    );
    if (!this.cache!.upiAccounts || this.cache!.upiAccounts.length === 0 || hasDemoUpi) {
      this.cache!.upiAccounts = JSON.parse(JSON.stringify(INITIAL_DATA.upiAccounts));
      mutated = true;
    } else {
      const hasGracy = this.cache!.upiAccounts.some((u) => u.upiId.toLowerCase() === 'gracyconstruction@sbi');
      if (!hasGracy) {
        this.cache!.upiAccounts.unshift({
          id: 'gbiz_gracy_sbi',
          upiId: 'gracyconstruction@sbi',
          payeeName: 'Gracy Construction',
          bankAccountId: 'bank_kotak_1',
          isGoogleBusiness: true,
          storeName: 'Gracy Construction Store',
          gpayMerchantId: 'GPAY_M_GRACY_01',
          terminalCode: 'TERM_01',
          dailyLimit: 500000,
          currentDayVolume: 0,
          minAmount: 10,
          maxAmount: 200000,
          isActive: true,
          priority: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        mutated = true;
      }
    }

    if (!this.cache!.users || this.cache!.users.length === 0) {
      this.cache!.users = JSON.parse(JSON.stringify(INITIAL_DATA.users));
      mutated = true;
    } else {
      // Ensure super admin exists
      const hasSuperAdmin = this.cache!.users.some(
        (u) => u.role === 'SUPER_ADMIN' || u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL
      );
      if (!hasSuperAdmin) {
        this.cache!.users.unshift({
          id: 'usr_superadmin',
          email: DEFAULT_ADMIN_EMAIL,
          name: DEFAULT_ADMIN_NAME,
          role: 'SUPER_ADMIN',
          passwordHash: INITIAL_SUPER_ADMIN_PASSWORD_HASH,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        mutated = true;
      }
    }

    if (!this.cache!.sessions) {
      this.cache!.sessions = [];
      mutated = true;
    }

    if (mutated) {
      this.save();
    }

    return this.cache!;
  }

  private save(): void {
    if (!this.cache) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed writing to db file:', err);
    }
  }

  // Merchants
  async getMerchants(): Promise<Merchant[]> {
    const data = this.ensureFile();
    return [...data.merchants];
  }

  async getMerchantByApiKey(apiKey: string): Promise<Merchant | null> {
    const data = this.ensureFile();
    return data.merchants.find((m) => m.apiKey === apiKey && m.isActive) || null;
  }

  async getMerchantById(id: string): Promise<Merchant | null> {
    const data = this.ensureFile();
    return data.merchants.find((m) => m.id === id) || null;
  }

  async getMerchantByCode(code: string): Promise<Merchant | null> {
    const data = this.ensureFile();
    return data.merchants.find((m) => m.code === code) || null;
  }

  // Bank Accounts
  async getBankAccounts(): Promise<BankAccount[]> {
    const data = this.ensureFile();
    return [...data.bankAccounts];
  }

  async getActiveBankAccounts(amount?: number): Promise<BankAccount[]> {
    const data = this.ensureFile();
    return data.bankAccounts
      .filter((b) => b.isActive && (amount === undefined || amount <= 0 || (b.minAmount <= amount && b.maxAmount >= amount)))
      .sort((a, b) => a.priority - b.priority || a.currentDayVolume - b.currentDayVolume);
  }

  async createBankAccount(bank: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'currentDayVolume'>): Promise<BankAccount> {
    const data = this.ensureFile();
    const newBank: BankAccount = {
      ...bank,
      id: `bank_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currentDayVolume: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.bankAccounts.push(newBank);
    this.save();
    return newBank;
  }

  async updateBankAccount(id: string, updates: Partial<BankAccount>): Promise<BankAccount | null> {
    const data = this.ensureFile();
    const index = data.bankAccounts.findIndex((b) => b.id === id);
    if (index === -1) return null;
    data.bankAccounts[index] = {
      ...data.bankAccounts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return data.bankAccounts[index];
  }

  async deleteBankAccount(id: string): Promise<boolean> {
    const data = this.ensureFile();
    const initialLen = data.bankAccounts.length;
    data.bankAccounts = data.bankAccounts.filter((b) => b.id !== id);
    if (data.bankAccounts.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // UPI Accounts
  async getUpiAccounts(): Promise<UpiAccount[]> {
    const data = this.ensureFile();
    return [...data.upiAccounts];
  }

  async getActiveUpiAccounts(amount?: number): Promise<UpiAccount[]> {
    const data = this.ensureFile();
    return data.upiAccounts
      .filter((u) => u.isActive && (amount === undefined || amount <= 0 || (u.minAmount <= amount && u.maxAmount >= amount)))
      .sort((a, b) => a.priority - b.priority || a.currentDayVolume - b.currentDayVolume);
  }

  async createUpiAccount(upi: Omit<UpiAccount, 'id' | 'createdAt' | 'updatedAt' | 'currentDayVolume'>): Promise<UpiAccount> {
    const data = this.ensureFile();
    const newUpi: UpiAccount = {
      ...upi,
      id: `upi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currentDayVolume: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.upiAccounts.push(newUpi);
    this.save();
    return newUpi;
  }

  async updateUpiAccount(id: string, updates: Partial<UpiAccount>): Promise<UpiAccount | null> {
    const data = this.ensureFile();
    const index = data.upiAccounts.findIndex((u) => u.id === id);
    if (index === -1) return null;
    data.upiAccounts[index] = {
      ...data.upiAccounts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return data.upiAccounts[index];
  }

  async deleteUpiAccount(id: string): Promise<boolean> {
    const data = this.ensureFile();
    const initialLen = data.upiAccounts.length;
    data.upiAccounts = data.upiAccounts.filter((u) => u.id !== id);
    if (data.upiAccounts.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Orders
  async getOrders(filter?: {
    status?: string;
    merchantId?: string;
    query?: string;
    limit?: number;
  }): Promise<PayinOrder[]> {
    const data = this.ensureFile();
    let res = [...data.orders];

    if (filter?.status && filter.status !== 'ALL') {
      res = res.filter((o) => o.status === filter.status);
    }
    if (filter?.merchantId) {
      res = res.filter((o) => o.merchantId === filter.merchantId);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase().trim();
      res = res.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.merchantOrderId.toLowerCase().includes(q) ||
          (o.userSubmittedUtr && o.userSubmittedUtr.toLowerCase().includes(q)) ||
          (o.userId && o.userId.toLowerCase().includes(q)) ||
          (o.customerName && o.customerName.toLowerCase().includes(q))
      );
    }

    res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filter?.limit) {
      res = res.slice(0, filter.limit);
    }

    return res;
  }

  async getOrderById(id: string): Promise<PayinOrder | null> {
    const data = this.ensureFile();
    return data.orders.find((o) => o.id === id) || null;
  }

  async getOrderByMerchantOrderId(merchantId: string, merchantOrderId: string): Promise<PayinOrder | null> {
    const data = this.ensureFile();
    return data.orders.find((o) => o.merchantId === merchantId && o.merchantOrderId === merchantOrderId) || null;
  }

  async createOrder(orderData: Omit<PayinOrder, 'id' | 'createdAt' | 'updatedAt' | 'webhookSent' | 'webhookAttempts'>): Promise<PayinOrder> {
    const data = this.ensureFile();
    const id = `MP_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newOrder: PayinOrder = {
      ...orderData,
      id,
      webhookSent: false,
      webhookAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.orders.push(newOrder);
    this.save();
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<PayinOrder>): Promise<PayinOrder | null> {
    const data = this.ensureFile();
    const index = data.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;
    data.orders[index] = {
      ...data.orders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return data.orders[index];
  }

  // Webhook logs
  async createWebhookLog(log: Omit<WebhookLog, 'id' | 'createdAt'>): Promise<WebhookLog> {
    const data = this.ensureFile();
    const newLog: WebhookLog = {
      ...log,
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    data.webhookLogs.push(newLog);
    this.save();
    return newLog;
  }

  async getWebhookLogs(orderId?: string): Promise<WebhookLog[]> {
    const data = this.ensureFile();
    let logs = [...data.webhookLogs];
    if (orderId) {
      logs = logs.filter((l) => l.orderId === orderId);
    }
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Stats
  async getDashboardStats() {
    const data = this.ensureFile();
    const orders = data.orders;

    const totalOrders = orders.length;
    const successfulOrders = orders.filter((o) => o.status === 'SUCCESS');
    const totalVolume = successfulOrders.reduce((sum, o) => sum + o.amount, 0);
    const pendingUtrs = orders.filter((o) => o.status === 'VERIFYING' || (o.status === 'PENDING' && o.userSubmittedUtr)).length;
    const disputedOrders = orders.filter((o) => o.status === 'BANK_MISMATCH' || o.status === 'DUPLICATE').length;
    const successRate = totalOrders > 0 ? ((successfulOrders.length / totalOrders) * 100).toFixed(1) : '100.0';

    return {
      totalVolume,
      totalOrders,
      successfulCount: successfulOrders.length,
      successRate,
      pendingUtrs,
      disputedOrders,
      activeBanksCount: data.bankAccounts.filter((b) => b.isActive).length,
      activeUpisCount: data.upiAccounts.filter((u) => u.isActive).length,
    };
  }

  // Users & RBAC
  async getUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    const data = this.ensureFile();
    return data.users.map(({ passwordHash, ...user }) => user);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const data = this.ensureFile();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const data = this.ensureFile();
    return data.users.find((u) => u.id === id) || null;
  }

  async createUser(user: {
    email: string;
    name: string;
    role: UserRole;
    password: string;
    merchantId?: string | null;
    businessName?: string | null;
    dailyLimit?: number;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<Omit<User, 'passwordHash'>> {
    const data = this.ensureFile();
    const existing = data.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      throw new Error('A user with this email already exists.');
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: user.email.toLowerCase().trim(),
      name: user.name.trim(),
      role: user.role,
      passwordHash: hashPassword(user.password),
      merchantId: user.merchantId || null,
      businessName: user.businessName || null,
      dailyLimit: user.dailyLimit || 100000,
      currentDayVolume: 0,
      minAmount: user.minAmount || 100,
      maxAmount: user.maxAmount || 50000,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.users.push(newUser);
    this.save();

    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  async updateUserLimits(id: string, limits: {
    dailyLimit?: number;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<Omit<User, 'passwordHash'> | null> {
    const data = this.ensureFile();
    const index = data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    if (limits.dailyLimit !== undefined) data.users[index].dailyLimit = limits.dailyLimit;
    if (limits.minAmount !== undefined) data.users[index].minAmount = limits.minAmount;
    if (limits.maxAmount !== undefined) data.users[index].maxAmount = limits.maxAmount;
    data.users[index].updatedAt = new Date().toISOString();
    this.save();

    const { passwordHash, ...safeUser } = data.users[index];
    return safeUser;
  }

  async getUserDailyVolume(userId: string): Promise<number> {
    const data = this.ensureFile();
    const today = new Date().toISOString().split('T')[0];
    const userOrders = data.orders.filter(
      (o) => (o.userId === userId || o.merchantId === userId) &&
        o.createdAt.startsWith(today) &&
        (o.status === 'SUCCESS' || o.status === 'PENDING' || o.status === 'VERIFYING')
    );
    return userOrders.reduce((sum, o) => sum + o.amount, 0);
  }

  async updateUserRole(id: string, role: UserRole): Promise<Omit<User, 'passwordHash'> | null> {
    const data = this.ensureFile();
    const index = data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    data.users[index].role = role;
    data.users[index].updatedAt = new Date().toISOString();
    this.save();

    const { passwordHash, ...safeUser } = data.users[index];
    return safeUser;
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<Omit<User, 'passwordHash'> | null> {
    const data = this.ensureFile();
    const index = data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    data.users[index].isActive = isActive;
    data.users[index].updatedAt = new Date().toISOString();
    this.save();

    const { passwordHash, ...safeUser } = data.users[index];
    return safeUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const data = this.ensureFile();
    const target = data.users.find((u) => u.id === id);
    if (!target) return false;
    // Protect primary super admin
    if (target.role === 'SUPER_ADMIN') {
      throw new Error('Cannot delete primary Super Admin.');
    }

    data.users = data.users.filter((u) => u.id !== id);
    this.save();
    return true;
  }

  // Sessions
  async createSession(user: User): Promise<Session> {
    const data = this.ensureFile();
    const token = `mpsess_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const session: Session = {
      token,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      expiresAt,
    };

    data.sessions.push(session);
    this.save();
    return session;
  }

  async getSession(token: string): Promise<Session | null> {
    const data = this.ensureFile();
    const session = data.sessions.find((s) => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      data.sessions = data.sessions.filter((s) => s.token !== token);
      this.save();
      return null;
    }

    return session;
  }

  async deleteSession(token: string): Promise<boolean> {
    const data = this.ensureFile();
    data.sessions = data.sessions.filter((s) => s.token !== token);
    this.save();
    return true;
  }
}

export const db = new JsonDatabase();
