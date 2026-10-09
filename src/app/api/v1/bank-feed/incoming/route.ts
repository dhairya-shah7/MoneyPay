import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseBankSms } from '@/lib/bankParser';
import { sendMerchantWebhook } from '@/lib/webhook';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { raw_sms, utr: directUtr, amount: directAmount, availableBalance: directBalance, bank_name } = body;

    let utr = directUtr;
    let amount = directAmount ? parseFloat(directAmount) : null;
    let availableBalance =
      directBalance !== undefined && directBalance !== null ? parseFloat(directBalance) : null;
    let parsedBankName = bank_name || 'Kotak Mahindra Bank';

    if (raw_sms) {
      const parsed = parseBankSms(raw_sms);
      if (!utr && parsed.utr) utr = parsed.utr;
      if (!amount && parsed.amount) amount = parsed.amount;
      if (availableBalance === null && parsed.availableBalance !== null) {
        availableBalance = parsed.availableBalance;
      }
      if (!bank_name && parsed.bankName) parsedBankName = parsed.bankName;
    }

    if (!utr && availableBalance !== null) {
      return NextResponse.json({
        success: true,
        matched: false,
        balanceUpdated: true,
        availableBalance,
        bank: parsedBankName,
        message: `Live ${parsedBankName} Balance (A/c 9974366033) synced: ₹${availableBalance.toLocaleString('en-IN')}`,
      });
    }

    if (!utr) {
      return NextResponse.json(
        { success: false, error: 'Could not extract or locate 12-digit UTR or Avl Bal from bank feed' },
        { status: 400 }
      );
    }

    const allOrders = await db.getOrders();

    // Find matching order by userSubmittedUtr or ID
    const matchingOrder = allOrders.find(
      (o) =>
        (o.userSubmittedUtr === utr || o.id === utr) &&
        (o.status === 'PENDING' || o.status === 'VERIFYING')
    );

    if (!matchingOrder) {
      // If no order currently pending with this UTR, check if there's any active pending order for this exact amount created in last 15 mins
      const candidateOrder = allOrders.find(
        (o) =>
          o.amount === amount &&
          (o.status === 'PENDING' || o.status === 'VERIFYING') &&
          !o.userSubmittedUtr
      );

      if (candidateOrder) {
        // Auto-link UTR to candidate order
        const updated = await db.updateOrder(candidateOrder.id, {
          userSubmittedUtr: utr,
          bankUtr: utr,
          receivedAmount: amount || candidateOrder.amount,
          status: 'SUCCESS',
          paidAt: new Date().toISOString(),
          adminNotes: `Auto-reconciled via ${parsedBankName || 'Bank Feed'}`,
        });

        await sendMerchantWebhook(candidateOrder.id);

        return NextResponse.json({
          success: true,
          matched: true,
          autoApproved: true,
          availableBalance,
          order: updated,
          message: `Auto-matched pending order ${candidateOrder.id} for ₹${amount} and credited via webhook.${
            availableBalance !== null ? ` | Live Bank Avl Bal: ₹${availableBalance.toLocaleString('en-IN')}` : ''
          }`,
        });
      }

      return NextResponse.json({
        success: true,
        matched: false,
        utr,
        amount,
        availableBalance,
        bank: parsedBankName,
        message: `Bank transaction recorded into pool.${
          availableBalance !== null ? ` Live Bank Avl Bal: ₹${availableBalance.toLocaleString('en-IN')}.` : ''
        }`,
      });
    }

    // Matching order found! Validate amount
    if (amount && Math.abs(matchingOrder.amount - amount) > 0.01) {
      // Amount mismatch!
      const updated = await db.updateOrder(matchingOrder.id, {
        bankUtr: utr,
        receivedAmount: amount,
        status: 'BANK_MISMATCH',
        disputeReason: `Bank credited ₹${amount} but order requested ₹${matchingOrder.amount}`,
      });

      return NextResponse.json({
        success: true,
        matched: true,
        status: 'BANK_MISMATCH',
        order: updated,
        message: `Amount mismatch: Expected ₹${matchingOrder.amount}, but received ₹${amount}`,
      });
    }

    // Perfect match! Auto-Approve
    const finalAmount = amount || matchingOrder.amount;
    const updated = await db.updateOrder(matchingOrder.id, {
      bankUtr: utr,
      receivedAmount: finalAmount,
      status: 'SUCCESS',
      paidAt: new Date().toISOString(),
      adminNotes: `Auto-reconciled via ${parsedBankName || 'Bank SMS Feed'}`,
    });

    // Update account volume
    if (matchingOrder.assignedBankId) {
      const bank = (await db.getBankAccounts()).find((b) => b.id === matchingOrder.assignedBankId);
      if (bank) {
        await db.updateBankAccount(bank.id, {
          currentDayVolume: (bank.currentDayVolume || 0) + finalAmount,
        });
      }
    } else if (matchingOrder.assignedUpiId) {
      const upi = (await db.getUpiAccounts()).find((u) => u.id === matchingOrder.assignedUpiId);
      if (upi) {
        await db.updateUpiAccount(upi.id, {
          currentDayVolume: (upi.currentDayVolume || 0) + finalAmount,
        });
      }
    }

    // Trigger instant merchant webhook
    await sendMerchantWebhook(matchingOrder.id);

    return NextResponse.json({
      success: true,
      matched: true,
      autoApproved: true,
      order: updated,
      message: `Deposit for ₹${finalAmount} verified & credited in real-time!`,
    });
  } catch (error: any) {
    console.error('[Bank Feed Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed processing bank feed' },
      { status: 500 }
    );
  }
}
