import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, requireRoles } from '@/lib/auth-server';
import { UserRole } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    // Allow SUPER_ADMIN and OPERATIONS_AGENT to view team members
    if (!session || !requireRoles(session, ['SUPER_ADMIN', 'OPERATIONS_AGENT'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Super Admin or Ops Agent required.' },
        { status: 403 }
      );
    }

    const users = await db.getUsers();
    return NextResponse.json({
      success: true,
      data: {
        users,
        currentUserId: session.userId,
        currentUserRole: session.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admin can invite and manage team members.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, name, role, password } = body;

    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, role, and temporary password are required.' },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['SUPER_ADMIN', 'OPERATIONS_AGENT', 'FINANCE_VIEWER', 'MERCHANT'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const newUser = await db.createUser({
      email,
      name,
      role,
      password,
    });

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'Team member added successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create user' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admin can edit member roles and access.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, role, isActive, dailyLimit, minAmount, maxAmount } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    let updatedUser = null;
    if (role !== undefined) {
      updatedUser = await db.updateUserRole(userId, role as UserRole);
    }

    if (isActive !== undefined) {
      updatedUser = await db.updateUserStatus(userId, Boolean(isActive));
    }

    if (dailyLimit !== undefined || minAmount !== undefined || maxAmount !== undefined) {
      updatedUser = await db.updateUserLimits(userId, {
        dailyLimit: dailyLimit !== undefined ? Number(dailyLimit) : undefined,
        minAmount: minAmount !== undefined ? Number(minAmount) : undefined,
        maxAmount: maxAmount !== undefined ? Number(maxAmount) : undefined,
      });
    }

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found or no changes made' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update user' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admin can delete team members.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await db.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: 'User removed successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete user' },
      { status: 400 }
    );
  }
}
