import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const startTime = Date.now();
    const stats = await db.getDashboardStats();
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'HEALTHY',
      service: 'MoneyPay Gateway & Direct Settlement Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      diagnostics: {
        database: 'CONNECTED',
        responseTimeMs: responseTime,
        activeBankAccounts: stats.activeBanksCount,
        activeUpiAccounts: stats.activeUpisCount,
        totalOrders: stats.totalOrders,
      },
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'UNHEALTHY',
      error: err?.message || 'Health check failed',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
