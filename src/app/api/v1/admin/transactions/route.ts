import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, requireRoles } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !requireRoles(session, ['SUPER_ADMIN', 'OPERATIONS_AGENT', 'FINANCE_VIEWER'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin session required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const query = searchParams.get('query') || undefined;
    const merchantId = searchParams.get('merchantId') || undefined;

    const orders = await db.getOrders({
      status,
      query,
      merchantId,
    });

    const merchants = await db.getMerchants();
    const merchantMap = Object.fromEntries(merchants.map((m) => [m.id, m.name]));

    const enriched = orders.map((o) => ({
      ...o,
      merchantName: merchantMap[o.merchantId] || 'Merchant',
    }));

    return NextResponse.json({
      success: true,
      orders: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed fetching orders' },
      { status: 500 }
    );
  }
}
