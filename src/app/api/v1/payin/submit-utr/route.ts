import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, utr, screenshot, paid_amount } = body;

    if (!order_id || !utr) {
      return NextResponse.json(
        { success: false, error: 'order_id and utr are required' },
        { status: 400 }
      );
    }

    const cleanedUtr = utr.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (cleanedUtr.length < 10) {
      return NextResponse.json(
        { success: false, error: 'UTR must be at least 10-12 digits' },
        { status: 400 }
      );
    }

    const order = await db.getOrderById(order_id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check duplicate UTR across other orders
    const allOrders = await db.getOrders();
    const duplicate = allOrders.find(
      (o) => o.id !== order.id && (o.userSubmittedUtr === cleanedUtr || o.bankUtr === cleanedUtr) && o.status === 'SUCCESS'
    );

    const newStatus = duplicate ? 'DUPLICATE' : 'VERIFYING';
    const disputeReason = duplicate ? `Duplicate UTR already used in order ${duplicate.id}` : null;

    const parsedPaid = paid_amount ? parseFloat(paid_amount) : undefined;
    const finalAmount = (order.amount <= 0 && parsedPaid && parsedPaid > 0) ? parsedPaid : order.amount;

    const updated = await db.updateOrder(order.id, {
      userSubmittedUtr: cleanedUtr,
      screenshotUrl: screenshot || order.screenshotUrl || null,
      amount: finalAmount,
      status: newStatus,
      disputeReason,
    });

    return NextResponse.json({
      success: true,
      order: updated,
      message: duplicate
        ? 'Warning: This UTR was previously used in another transaction'
        : 'UTR submitted successfully. Verifying with banking network.',
    });
  } catch (error: any) {
    console.error('[submit-utr] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to submit UTR' },
      { status: 500 }
    );
  }
}
