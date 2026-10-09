import { NextRequest } from 'next/server';
import { db } from './db';
import { Session, UserRole } from './types';

export async function getSessionFromRequest(req: NextRequest): Promise<Session | null> {
  // Check cookie
  const cookieToken = req.cookies.get('moneypay_session')?.value;
  if (cookieToken) {
    const session = await db.getSession(cookieToken);
    if (session) return session;
  }

  // Check Authorization Bearer header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = await db.getSession(token);
    if (session) return session;
  }

  return null;
}

export function requireRoles(session: Session | null, allowedRoles: UserRole[]): boolean {
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN') return true; // Super admin has full access
  return allowedRoles.includes(session.role);
}
