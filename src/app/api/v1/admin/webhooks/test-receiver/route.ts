import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-moneypay-signature');
    const event = req.headers.get('x-moneypay-event');
    const body = await req.json();

    console.log('[Test Webhook Receiver] Received:', {
      event,
      signature,
      body,
    });

    return NextResponse.json({
      success: true,
      received_at: new Date().toISOString(),
      event,
      status: 'WEBHOOK_ACKNOWLEDGED',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Invalid webhook payload' },
      { status: 400 }
    );
  }
}
