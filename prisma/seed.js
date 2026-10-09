const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MoneyPay database...');

  // 1. Create Default Merchant
  const defaultMerchant = await prisma.merchant.upsert({
    where: { code: 'MERCHANT_DEMO' },
    update: {},
    create: {
      name: 'MoneyPay Demo Platform',
      code: 'MERCHANT_DEMO',
      apiKey: 'mp_live_k928f01a89c20a1e3bf89',
      apiSecret: 'mp_sec_89df201ba873910c28479e0189',
      webhookUrl: 'http://localhost:3000/api/v1/admin/webhooks/test-receiver',
      isActive: true,
    },
  });
  console.log('Created Merchant:', defaultMerchant.name);

  // 2. Create Active Bank Accounts
  const bank1 = await prisma.bankAccount.upsert({
    where: { accountNumber: '50200084729103' },
    update: {},
    create: {
      bankName: 'HDFC Bank',
      accountNumber: '50200084729103',
      ifscCode: 'HDFC0001234',
      accountHolder: 'MONEYPAY DIGITAL SERVICES PVT LTD',
      upiId: 'moneypay.hdfc@okaxis',
      dailyLimit: 500000,
      minAmount: 100,
      maxAmount: 100000,
      isActive: true,
      priority: 1,
    },
  });

  const bank2 = await prisma.bankAccount.upsert({
    where: { accountNumber: '918020058392019' },
    update: {},
    create: {
      bankName: 'ICICI Bank',
      accountNumber: '918020058392019',
      ifscCode: 'ICIC0000456',
      accountHolder: 'MONEYPAY TECH ENTERPRISE',
      upiId: 'moneypay.icici@icici',
      dailyLimit: 750000,
      minAmount: 500,
      maxAmount: 200000,
      isActive: true,
      priority: 2,
    },
  });

  // 3. Create Active UPI IDs
  const upi1 = await prisma.upiAccount.upsert({
    where: { upiId: 'moneypay@kotak' },
    update: {},
    create: {
      upiId: 'moneypay@kotak',
      payeeName: 'MoneyPay Kotak Direct',
      dailyLimit: 300000,
      minAmount: 100,
      maxAmount: 50000,
      isActive: true,
      priority: 1,
    },
  });

  const upi2 = await prisma.upiAccount.upsert({
    where: { upiId: 'moneypaypayin@yesbank' },
    update: {},
    create: {
      upiId: 'moneypaypayin@yesbank',
      payeeName: 'MoneyPay Merchant Collector',
      dailyLimit: 300000,
      minAmount: 100,
      maxAmount: 50000,
      isActive: true,
      priority: 2,
    },
  });

  // 4. Create an initial sample test order
  const sampleOrder = await prisma.payinOrder.create({
    data: {
      merchantId: defaultMerchant.id,
      merchantOrderId: 'ORD_INIT_DEMO_01',
      userId: 'PLAYER_789',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav@example.com',
      customerPhone: '+91 9876543210',
      amount: 1500.0,
      status: 'VERIFYING',
      assignedType: 'UPI',
      assignedUpiId: upi1.id,
      assignedUpiString: upi1.upiId,
      assignedHolder: upi1.payeeName,
      userSubmittedUtr: '428901829381',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  console.log('Database seeded successfully! Sample Order:', sampleOrder.id);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
