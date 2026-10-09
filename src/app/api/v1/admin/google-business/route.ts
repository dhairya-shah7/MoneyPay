import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseGoogleBusinessText, extractGoogleBusinessFromImage } from '@/lib/googleBusinessExtractor';

export async function GET(req: NextRequest) {
  try {
    const upis = await db.getUpiAccounts();
    const banks = await db.getBankAccounts();
    const googleBizAccounts = upis.map((u) => {
      const parentBank = banks.find((b) => b.id === u.bankAccountId) || banks[0];
      return {
        ...u,
        parentBankName: parentBank?.bankName || 'Kotak Mahindra Bank',
        parentAccountNo: parentBank?.accountNumber || '9974366033',
        parentHolder: parentBank?.accountHolder || 'AGS',
      };
    });

    return NextResponse.json({
      success: true,
      data: googleBizAccounts,
      total: googleBizAccounts.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed fetching Google Business accounts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode, // 'EXTRACT' or 'MANUAL'
      screenshot, // base64
      rawText,
      upiId,
      payeeName,
      storeName,
      gpayMerchantId,
      terminalCode,
      dailyLimit,
      bankAccountId,
    } = body;

    // Mode 1: Auto-Extract preview from Screenshot / Raw Text
    if (mode === 'EXTRACT') {
      let extracted;
      if (screenshot) {
        extracted = await extractGoogleBusinessFromImage(screenshot);
      } else if (rawText) {
        extracted = parseGoogleBusinessText(rawText);
      } else {
        return NextResponse.json(
          { success: false, error: 'Provide screenshot or rawText for extraction' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        extracted,
        message: 'Google Business details extracted successfully',
      });
    }

    // Mode 2: Create / Save Google Business account
    if (!upiId) {
      return NextResponse.json(
        { success: false, error: 'UPI ID is required' },
        { status: 400 }
      );
    }

    const cleanUpi = upiId.trim().toLowerCase();
    const banks = await db.getBankAccounts();
    const parentBank = banks.find((b) => b.id === bankAccountId) || banks[0];

    const newAccount = await db.createUpiAccount({
      upiId: cleanUpi,
      payeeName: payeeName?.trim() || 'Gracy Construction',
      bankAccountId: parentBank?.id || 'bank_kotak_1',
      isGoogleBusiness: true,
      storeName: storeName?.trim() || 'Google Business Outlet',
      gpayMerchantId: gpayMerchantId?.trim() || `GPAY_${Date.now().toString().slice(-4)}`,
      terminalCode: terminalCode?.trim() || 'TERM_01',
      dailyLimit: Number(dailyLimit) || 500000,
      minAmount: 10,
      maxAmount: 200000,
      isActive: true,
      priority: 1,
    });

    return NextResponse.json({
      success: true,
      data: newAccount,
      message: `Google Business account ${newAccount.upiId} linked to ${parentBank?.bankName || 'Kotak Mahindra Bank'} successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed processing Google Business account' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isActive, dailyLimit, payeeName, storeName, terminalCode, priority } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const updated = await db.updateUpiAccount(id, {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(dailyLimit !== undefined ? { dailyLimit: Number(dailyLimit) } : {}),
      ...(payeeName !== undefined ? { payeeName } : {}),
      ...(storeName !== undefined ? { storeName } : {}),
      ...(terminalCode !== undefined ? { terminalCode } : {}),
      ...(priority !== undefined ? { priority: Number(priority) } : {}),
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed updating account' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id query param required' }, { status: 400 });
    }

    const deleted = await db.deleteUpiAccount(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed deleting account' },
      { status: 500 }
    );
  }
}
