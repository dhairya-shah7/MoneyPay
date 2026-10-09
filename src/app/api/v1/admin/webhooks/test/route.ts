import { NextRequest, NextResponse } from 'next/server';
import { generateSignature } from '@/lib/webhook';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, secret, orderId } = body;

    const targetUrl = url || 'http://localhost:3000/api/v1/admin/webhooks/test-receiver';
    const apiSecret = secret || 'mp_sec_89df201ba873910c28479e0189';

    const payload = {
      event: 'PAYIN_SUCCESS',
      order_id: orderId || `MP_TEST_${Date.now().toString().slice(-4)}`,
      merchant_order_id: `ORD_TEST_${Date.now()}`,
      user_id: 'USER_SIMULATOR',
      amount: 500.0,
      received_amount: 500.0,
      utr: '428901829381',
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    };

    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, apiSecret);

    const startTime = Date.now();
    let responseStatus = 0;
    let responseBody = '';

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MoneyPay-Signature': signature,
          'X-MoneyPay-Event': payload.event,
        },
        body: payloadString,
      });
      responseStatus = res.status;
      responseBody = await res.text();
    } catch (err: any) {
      responseStatus = 500;
      responseBody = err?.message || 'Connection failed';
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: responseStatus >= 200 && responseStatus < 300,
      status: responseStatus,
      latencyMs,
      payload,
      signature,
      responseBody,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Webhook test failed' },
      { status: 500 }
    );
  }
}
