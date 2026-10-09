import { NextRequest, NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon_ip';
    const limit = checkRateLimit(`login_${ip}`, 10, 60000); // 10 attempts per minute
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please wait 1 minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Your account has been deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    const inputHash = hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const session = await db.createSession(user);

    const response = NextResponse.json({
      success: true,
      data: {
        token: session.token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: 'moneypay_session',
      value: session.token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    console.error('[Auth Login Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal authentication error' },
      { status: 500 }
    );
  }
}
