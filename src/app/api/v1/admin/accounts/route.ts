import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, requireRoles } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !requireRoles(session, ['SUPER_ADMIN', 'OPERATIONS_AGENT', 'FINANCE_VIEWER'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const bankAccounts = await db.getBankAccounts();
    const upiAccounts = await db.getUpiAccounts();
    return NextResponse.json({
      success: true,
      bankAccounts,
      upiAccounts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !requireRoles(session, ['SUPER_ADMIN', 'OPERATIONS_AGENT'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }
    const body = await req.json();
    const { type, ...accountData } = body;

    if (type === 'BANK') {
      const { bankName, accountNumber, ifscCode, accountHolder, upiId, dailyLimit, minAmount, maxAmount, priority } = accountData;
      if (!bankName || !accountNumber || !ifscCode || !accountHolder) {
        return NextResponse.json(
          { success: false, error: 'Bank Name, Account Number, IFSC, and Holder Name are required' },
          { status: 400 }
        );
      }

      const created = await db.createBankAccount({
        bankName,
        accountNumber,
        ifscCode,
        accountHolder,
        upiId: upiId || null,
        dailyLimit: parseFloat(dailyLimit) || 500000,
        minAmount: parseFloat(minAmount) || 100,
        maxAmount: parseFloat(maxAmount) || 100000,
        isActive: true,
        priority: parseInt(priority) || 1,
      });

      return NextResponse.json({ success: true, account: created });
    } else if (type === 'UPI') {
      const { upiId, payeeName, dailyLimit, minAmount, maxAmount, priority } = accountData;
      if (!upiId || !payeeName) {
        return NextResponse.json(
          { success: false, error: 'UPI ID and Payee Name are required' },
          { status: 400 }
        );
      }

      const created = await db.createUpiAccount({
        upiId,
        payeeName,
        dailyLimit: parseFloat(dailyLimit) || 200000,
        minAmount: parseFloat(minAmount) || 100,
        maxAmount: parseFloat(maxAmount) || 50000,
        isActive: true,
        priority: parseInt(priority) || 1,
      });

      return NextResponse.json({ success: true, account: created });
    }

    return NextResponse.json({ success: false, error: 'Invalid account type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed creating account' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !requireRoles(session, ['SUPER_ADMIN', 'OPERATIONS_AGENT'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const body = await req.json();
    const { type, id, updates } = body;

    if (!type || !id || !updates) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    if (type === 'BANK') {
      const updated = await db.updateBankAccount(id, updates);
      return NextResponse.json({ success: true, account: updated });
    } else if (type === 'UPI') {
      const updated = await db.updateUpiAccount(id, updates);
      return NextResponse.json({ success: true, account: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed updating account' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !requireRoles(session, ['SUPER_ADMIN', 'OPERATIONS_AGENT'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'type and id are required' }, { status: 400 });
    }

    if (type === 'BANK') {
      const deleted = await db.deleteBankAccount(id);
      return NextResponse.json({ success: deleted });
    } else if (type === 'UPI') {
      const deleted = await db.deleteUpiAccount(id);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed deleting account' },
      { status: 500 }
    );
  }
}
