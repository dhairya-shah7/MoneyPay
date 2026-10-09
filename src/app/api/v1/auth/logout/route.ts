import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get('moneypay_session')?.value;
    if (cookieToken) {
      await db.deleteSession(cookieToken);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Expire cookie
    response.cookies.set({
      name: 'moneypay_session',
      value: '',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
