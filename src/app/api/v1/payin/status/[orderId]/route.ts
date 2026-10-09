import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const order = await db.getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check expiry
    if (order.status === 'PENDING') {
      const isExpired = new Date(order.expiresAt).getTime() < Date.now();
      if (isExpired) {
        const updated = await db.updateOrder(order.id, { status: 'EXPIRED' });
        return NextResponse.json({
          success: true,
          order: updated,
        });
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed fetching status' },
      { status: 500 }
    );
  }
}
