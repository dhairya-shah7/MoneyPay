import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { allocateReceivingAccount } from '@/lib/accountRouter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      merchant_order_id,
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      preferred_type, // "UPI" or "BANK"
    } = body;

    // Check authorization header or body api_key
    const apiKey = req.headers.get('x-api-key') || body.api_key;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing API key. Provide X-API-Key header or api_key in body.' },
        { status: 401 }
      );
    }

    const merchant = await db.getMerchantByApiKey(apiKey);
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive merchant API key' },
        { status: 403 }
      );
    }

    const parsedAmount = amount !== undefined && amount !== null && amount !== '' ? parseFloat(amount) : 0;
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be 0 or a positive number' },
        { status: 400 }
      );
    }

    if (!merchant_order_id) {
      return NextResponse.json(
        { success: false, error: 'merchant_order_id is required' },
        { status: 400 }
      );
    }

    // Dynamic App URL resolution based on current request host & protocol (for seamless mobile & network support)
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '127.0.0.1:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const appUrl = `${proto}://${host}`;

    // Check User Limits if user_id or customer is specified
    if (user_id) {
      const user = await db.getUserById(user_id) || await db.getUserByEmail(user_id);
      if (user && parsedAmount > 0) {
        if (user.minAmount && parsedAmount < user.minAmount) {
          return NextResponse.json(
            { success: false, error: `Minimum deposit limit for this user is ₹${user.minAmount}` },
            { status: 400 }
          );
        }
        if (user.maxAmount && parsedAmount > user.maxAmount) {
          return NextResponse.json(
            { success: false, error: `Maximum single deposit limit for this user is ₹${user.maxAmount}` },
            { status: 400 }
          );
        }
        if (user.dailyLimit) {
          const currentDailyVolume = await db.getUserDailyVolume(user.id);
          if (currentDailyVolume + parsedAmount > user.dailyLimit) {
            return NextResponse.json(
              {
                success: false,
                error: `Daily deposit limit of ₹${user.dailyLimit} reached. (Used today: ₹${currentDailyVolume})`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Check if order already exists for this merchant
    const existing = await db.getOrderByMerchantOrderId(merchant.id, merchant_order_id);
    if (existing) {
      return NextResponse.json({
        success: true,
        order_id: existing.id,
        merchant_order_id: existing.merchantOrderId,
        amount: existing.amount,
        status: existing.status,
        checkout_url: `${appUrl}/pay/${existing.id}`,
        message: 'Order already exists, returning active session',
      });
    }

    // Allocate receiving account from active pool
    const allocated = await allocateReceivingAccount(parsedAmount, preferred_type);

    // 15 minutes expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const order = await db.createOrder({
      merchantId: merchant.id,
      merchantOrderId: merchant_order_id,
      userId: user_id || null,
      customerName: customer_name || null,
      customerEmail: customer_email || null,
      customerPhone: customer_phone || null,
      amount: parsedAmount,
      status: 'PENDING',
      assignedType: allocated.type,
      assignedBankId: allocated.assignedBankId || null,
      assignedUpiId: allocated.assignedUpiId || null,
      assignedUpiString: allocated.assignedUpiString || null,
      assignedAccountNo: allocated.assignedAccountNo || null,
      assignedIfsc: allocated.assignedIfsc || null,
      assignedHolder: allocated.assignedHolder || null,
      assignedBankName: allocated.assignedBankName || null,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      merchant_order_id: order.merchantOrderId,
      amount: order.amount,
      status: order.status,
      checkout_url: `${appUrl}/pay/${order.id}`,
      expires_at: order.expiresAt,
    });
  } catch (error: any) {
    console.error('[API create-payin] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
