import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, requireRoles } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !requireRoles(session, ['SUPER_ADMIN', 'OPERATIONS_AGENT', 'FINANCE_VIEWER'])) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const stats = await db.getDashboardStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed fetching stats' },
      { status: 500 }
    );
  }
}
