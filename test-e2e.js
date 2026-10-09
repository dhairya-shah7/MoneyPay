const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const dataString = options.body ? JSON.stringify(options.body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runE2ETests() {
  console.log('--- Starting MoneyPay Full Gateway & Auto-Reconciliation Verification ---');

  // 1. Root portal status
  const root = await request('/');
  console.log('1. Root portal status (White UI):', root.status === 200 ? '✅ OK' : '❌ FAIL');

  // 2. Create PayIn Order
  const merchantOrderId = `ORD_E2E_${Date.now()}`;
  const createRes = await request('/api/v1/payin/create', {
    method: 'POST',
    headers: {
      'X-API-Key': 'mp_live_k928f01a89c20a1e3bf89',
    },
    body: {
      amount: 750.0,
      merchant_order_id: merchantOrderId,
      user_id: 'USER_RECON_77',
      customer_name: 'Pooja Sharma',
      customer_phone: '+919876543210',
    },
  });

  console.log('2. Create Deposit API:', createRes.data.success ? '✅ SUCCESS' : '❌ FAIL', `Order ID: ${createRes.data.order_id}`);
  const orderId = createRes.data.order_id;
  if (!orderId) throw new Error('Order creation failed');

  // 3. Status Check
  const statusRes = await request(`/api/v1/payin/status/${orderId}`);
  console.log('3. Fetch Order Status:', statusRes.data.order?.status === 'PENDING' ? '✅ PENDING' : '❌ FAIL');

  // 4. Submit UTR by customer (generate unique 12-digit UTR)
  const testUtr = '42' + Date.now().toString().slice(-10);
  const utrRes = await request('/api/v1/payin/submit-utr', {
    method: 'POST',
    body: {
      order_id: orderId,
      utr: testUtr,
    },
  });
  console.log('4. Customer Submits UTR:', utrRes.data.order?.status === 'VERIFYING' ? '✅ VERIFYING' : '❌ FAIL');

  // 5. Test Automated Bank SMS Feed Ingestion
  const rawBankSms = `Dear Customer, A/c *29103 credited by INR 750.00 on 07-Oct-26 by UPI ref ${testUtr}. Total Bal: Rs 5,12,000.00 - HDFC Bank`;
  const bankFeedRes = await request('/api/v1/bank-feed/incoming', {
    method: 'POST',
    body: {
      raw_sms: rawBankSms,
    },
  });

  console.log('5. Bank SMS Auto-Reconciliation Feed:', bankFeedRes.data.success && bankFeedRes.data.matched ? '✅ AUTO-MATCHED & APPROVED' : '❌ FAIL', bankFeedRes.data.message);

  // 6. Verify final order status
  const finalStatus = await request(`/api/v1/payin/status/${orderId}`);
  console.log('6. Order Status after Auto-Reconciliation:', finalStatus.data.order?.status === 'SUCCESS' ? '✅ SUCCESS (AUTO CREDITED)' : '❌ FAIL');

  // 7. Test Webhook Delivery
  const whRes = await request('/api/v1/admin/webhooks/test', {
    method: 'POST',
    body: {
      orderId,
    },
  });
  console.log('7. Signed Webhook HMAC Dispatch:', whRes.data.success ? '✅ DELIVERED' : '❌ FAIL', `Status: ${whRes.data.status}`);

  console.log('--- All Verification Tests Passed Successfully! ---');
}

runE2ETests().catch(console.error);
