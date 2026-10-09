import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon_ip';
    const limit = checkRateLimit(`signup_${ip}`, 5, 60000); // 5 signups per minute per IP
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many account creation attempts. Please wait 1 minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, name, businessName } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Create user with MERCHANT role
    const newUser = await db.createUser({
      email,
      name,
      role: 'MERCHANT',
      password,
      businessName: businessName || `${name}'s Store`,
      dailyLimit: 100000,
      minAmount: 100,
      maxAmount: 50000,
    });

    // Auto-create session
    const fullUser = await db.getUserByEmail(email);
    let sessionToken = '';
    if (fullUser) {
      const session = await db.createSession(fullUser);
      sessionToken = session.token;
    }

    const response = NextResponse.json({
      success: true,
      data: {
        token: sessionToken,
        user: newUser,
      },
      message: 'Account created successfully!',
    });

    if (sessionToken) {
      response.cookies.set({
        name: 'moneypay_session',
        value: sessionToken,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;
  } catch (err: any) {
    console.error('[Signup API Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}
