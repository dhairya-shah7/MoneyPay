import crypto from 'crypto';
import { db } from './db';

export interface WebhookPayload {
  event: 'PAYIN_SUCCESS' | 'PAYIN_FAILED' | 'PAYIN_DISPUTED' | 'PAYIN_MISMATCH';
  order_id: string;
  merchant_order_id: string;
  user_id?: string | null;
  amount: number;
  received_amount?: number | null;
  utr?: string | null;
  status: string;
  timestamp: string;
}

export function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export async function sendMerchantWebhook(orderId: string): Promise<boolean> {
  try {
    const order = await db.getOrderById(orderId);
    if (!order) return false;

    const merchant = await db.getMerchantById(order.merchantId);
    if (!merchant || !merchant.webhookUrl) {
      console.log(`[Webhook] No webhook URL configured for order ${orderId}`);
      return false;
    }

    const payload: WebhookPayload = {
      event: order.status === 'SUCCESS' ? 'PAYIN_SUCCESS' : 'PAYIN_FAILED',
      order_id: order.id,
      merchant_order_id: order.merchantOrderId,
      user_id: order.userId,
      amount: order.amount,
      received_amount: order.receivedAmount || order.amount,
      utr: order.userSubmittedUtr || order.bankUtr,
      status: order.status,
      timestamp: new Date().toISOString(),
    };

    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, merchant.apiSecret);

    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let isSuccess = false;

    try {
      const response = await fetch(merchant.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MoneyPay-Signature': signature,
          'X-MoneyPay-Event': payload.event,
        },
        body: payloadString,
      });

      responseStatus = response.status;
      responseBody = await response.text();
      isSuccess = response.ok;
    } catch (err: any) {
      responseStatus = 500;
      responseBody = err?.message || 'Network error delivering webhook';
      isSuccess = false;
    }

    // Save webhook log
    await db.createWebhookLog({
      orderId: order.id,
      event: payload.event,
      url: merchant.webhookUrl,
      payload: payloadString,
      responseStatus,
      responseBody: responseBody ? responseBody.slice(0, 1000) : null,
      success: isSuccess,
    });

    // Update order webhook stats
    await db.updateOrder(order.id, {
      webhookSent: isSuccess,
      webhookAttempts: (order.webhookAttempts || 0) + 1,
      webhookLastResponse: `Status ${responseStatus}: ${responseBody?.slice(0, 100)}`,
    });

    return isSuccess;
  } catch (error) {
    console.error(`[Webhook] Failed to dispatch webhook for ${orderId}:`, error);
    return false;
  }
}
