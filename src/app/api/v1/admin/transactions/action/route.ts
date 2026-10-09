import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendMerchantWebhook } from '@/lib/webhook';
import { getSessionFromRequest, requireRoles } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !requireRoles(session, ['SUPER_ADMIN', 'OPERATIONS_AGENT'])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Super Admin or Ops Agent required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderId, action, reason, receivedAmount } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: 'orderId and action are required' },
        { status: 400 }
      );
    }

    const order = await db.getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    let updatedOrder = null;

    switch (action) {
      case 'APPROVE': {
        const finalReceivedAmount = receivedAmount ? parseFloat(receivedAmount) : order.amount;
        updatedOrder = await db.updateOrder(orderId, {
          status: 'SUCCESS',
          receivedAmount: finalReceivedAmount,
          paidAt: new Date().toISOString(),
          adminNotes: reason ? `Approved: ${reason}` : 'Approved by Admin',
        });

        // Update assigned account volume
        if (order.assignedBankId) {
          const bank = (await db.getBankAccounts()).find((b) => b.id === order.assignedBankId);
          if (bank) {
            await db.updateBankAccount(bank.id, {
              currentDayVolume: (bank.currentDayVolume || 0) + finalReceivedAmount,
            });
          }
        } else if (order.assignedUpiId) {
          const upi = (await db.getUpiAccounts()).find((u) => u.id === order.assignedUpiId);
          if (upi) {
            await db.updateUpiAccount(upi.id, {
              currentDayVolume: (upi.currentDayVolume || 0) + finalReceivedAmount,
            });
          }
        }

        // Send instant webhook to merchant
        await sendMerchantWebhook(orderId);
        break;
      }

      case 'REJECT': {
        updatedOrder = await db.updateOrder(orderId, {
          status: 'FAILED',
          disputeReason: reason || 'Rejected by Admin',
        });
        await sendMerchantWebhook(orderId);
        break;
      }

      case 'MARK_MISMATCH': {
        updatedOrder = await db.updateOrder(orderId, {
          status: 'BANK_MISMATCH',
          receivedAmount: receivedAmount ? parseFloat(receivedAmount) : null,
          disputeReason: reason || 'Amount Mismatch reported by bank node',
        });
        break;
      }

      case 'MARK_DUPLICATE': {
        updatedOrder = await db.updateOrder(orderId, {
          status: 'DUPLICATE',
          disputeReason: reason || 'Duplicate UTR transaction',
        });
        break;
      }

      case 'RETRIGGER_WEBHOOK': {
        const success = await sendMerchantWebhook(orderId);
        updatedOrder = await db.getOrderById(orderId);
        return NextResponse.json({
          success,
          order: updatedOrder,
          message: success ? 'Webhook sent successfully' : 'Webhook dispatch failed or failed endpoint',
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Transaction ${action} successfully`,
    });
  } catch (error: any) {
    console.error('[Admin action error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed executing action' },
      { status: 500 }
    );
  }
}
