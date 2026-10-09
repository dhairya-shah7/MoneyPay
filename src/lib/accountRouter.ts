import { db } from './db';
import { BankAccount, UpiAccount } from './types';

export interface AllocatedAccount {
  type: 'UPI' | 'BANK';
  assignedBankId?: string;
  assignedUpiId?: string;
  assignedUpiString?: string;
  assignedAccountNo?: string;
  assignedIfsc?: string;
  assignedHolder?: string;
  assignedBankName?: string;
}

/**
 * Smartly allocate an active UPI or Bank account based on amount and current daily turnover.
 */
export async function allocateReceivingAccount(amount: number, preferredType?: 'UPI' | 'BANK'): Promise<AllocatedAccount> {
  const activeBanks = await db.getActiveBankAccounts(amount);
  const activeUpis = await db.getActiveUpiAccounts(amount);

  const bank = activeBanks[0];
  const upi = activeUpis[0];

  // If the allocated UPI has a parent bank account linked, resolve it
  const parentBank = upi?.bankAccountId
    ? activeBanks.find((b) => b.id === upi.bankAccountId) || bank
    : bank;

  const finalBank = parentBank || {
    id: 'bank_kotak_1',
    bankName: 'Kotak Mahindra Bank',
    accountNumber: '9974366033',
    ifscCode: 'KKBK0002626',
    accountHolder: 'AGS',
  };

  return {
    type: preferredType === 'BANK' ? 'BANK' : 'UPI',
    assignedBankId: finalBank.id,
    assignedUpiId: upi?.id || 'gbiz_gracy_sbi',
    assignedUpiString: upi?.upiId || 'gracyconstruction@sbi',
    assignedAccountNo: finalBank.accountNumber,
    assignedIfsc: finalBank.ifscCode,
    assignedHolder: upi?.payeeName || finalBank.accountHolder || 'Gracy Construction',
    assignedBankName: finalBank.bankName,
  };
}
