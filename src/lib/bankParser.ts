export interface ParsedBankTransaction {
  bankName: string;
  accountNumber?: string;
  txnType: 'credit' | 'debit' | 'balance_only';
  amount: number | null;
  availableBalance: number | null;
  utr: string | null;
  remitter?: string | null;
  rawText: string;
  summary: string;
}

export function parseBankSms(smsText: string): ParsedBankTransaction {
  const text = (smsText || '').trim();

  // 1. Extract 12-digit UTR / UPI Reference Number or Alphanumeric Bank UTR
  let utr: string | null = null;
  const utrPatterns = [
    /(?:UTR|Ref(?:erence)?\s*(?:No\.?|num)?|NEFT|RTGS|IFT)\s*[:\-\/]?\s*([A-Z]{4}[A-Z0-9]{8,18})/i,
    /\b([A-Z]{4}[HRN]\d{9,17})\b/,
    /(?:UPI\/|Ref(?:erence)?\s*(?:No\.?|num)?\s*[:\-]?\s*|UTR\s*[:\-]?\s*|Txn\s*ID\s*[:\-]?\s*|RRN\s*[:\-]?\s*|Info:\s*UPI\/)(\d{12})/i,
    /(?:UPI\s+Ref\s+No\s*)(\d{12})/i,
    /(?:UPI:\s*)(\d{12})/i,
    /(?:IMPS\/|NEFT\/|RTGS\/)([A-Z0-9]{10,22})/i,
    /(?:\b|\D)(\d{12})(?:\b|\D)/,
  ];

  for (const pattern of utrPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      utr = match[1].toUpperCase();
      break;
    }
  }

  // 2. Extract Live Available Bank Balance (Comprehensive Indian Bank formats)
  let availableBalance: number | null = null;
  const balancePatterns = [
    /(?:Avl\.?\s*Bal(?:ance)?|Available\s*Bal(?:ance)?|Clear\s*Bal(?:ance)?|Updated\s*Bal(?:ance)?|Total\s*Bal(?:ance)?|A\/c\s*Bal(?:ance)?|Net\s*Bal(?:ance)?)\s*(?:in\s+your\s+[A-Za-z0-9\s\/\*xX]+?)?(?:is)?\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:has\s+a\s+balance\s+of|balance\s+(?:for|in)\s+[^is]+is|balance\s+is)\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Bal(?:ance)?)\s*(?:is)?\s*[:\-]\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Avl\.?\s*Bal(?:ance)?|Available\s*Bal(?:ance)?)\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\bBal\s+(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of balancePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed >= 0) {
        availableBalance = parsed;
        break;
      }
    }
  }

  // 3. Determine Transaction Type
  let txnType: 'credit' | 'debit' | 'balance_only' = 'balance_only';
  const isDebit = /\b(?:debited|withdrawn|spent|paid\s+to|transferred\s+to)\b/i.test(text);
  const isCredit = /\b(?:credited|deposited|received|paid\s+by|refunded)\b/i.test(text);

  if (isDebit && !isCredit) {
    txnType = 'debit';
  } else if (isCredit) {
    txnType = 'credit';
  } else {
    txnType = 'balance_only';
  }

  // 4. Extract Amount without catching ending balance
  const textWithoutBalance = text.replace(
    /(?:Avl\.?\s*Bal(?:ance)?|Available\s*Bal(?:ance)?|Clear\s*Bal(?:ance)?|Updated\s*Bal(?:ance)?|Total\s*Bal(?:ance)?|A\/c\s*Bal(?:ance)?|has\s+a\s+balance|balance\s+is|Bal\s*[:\-]|Bal\s+Rs).*$/i,
    ''
  );

  let amount: number | null = null;
  if (txnType !== 'balance_only') {
    const amountPatterns = [
      /(?:credited|deposited|received|debited|transferred|withdrawn)\s+(?:by|with|for)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
      /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:is\s+)?(?:credited|debited|received|paid|transferred|deposited)/i,
      /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    ];

    for (const pattern of amountPatterns) {
      const match = textWithoutBalance.match(pattern);
      if (match && match[1]) {
        const cleaned = match[1].replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed;
          break;
        }
      }
    }
  }

  // 5. Extract Remitter Name
  let remitter: string | undefined = undefined;
  const remitterMatch = text.match(/(?:from|by|to)\s+([A-Za-z0-9@._\s]{2,28}?)(?:\s+on|\s+via|\s+in|\s+UPI|\s+UTR|\.|$)/i);
  if (remitterMatch && remitterMatch[1]) {
    const cleanRemitter = remitterMatch[1].trim();
    if (!/^(?:your|a\/c|account|Rs|INR)$/i.test(cleanRemitter)) {
      remitter = cleanRemitter;
    }
  }

  // 6. Extract Account Number slice
  let accountNumber: string | undefined = undefined;
  const accMatch = text.match(/(?:A\/c|AC|Acct|Account)\s*(?:No\.?)?\s*[\*xX]*(\d{3,10})/i);
  if (accMatch && accMatch[1]) {
    accountNumber = accMatch[1];
  }

  // 7. Identify Bank Name
  let bankName = 'Kotak Mahindra Bank';
  if (/Kotak|KKBK/i.test(text)) bankName = 'Kotak Mahindra Bank';
  else if (/Baroda|BARB|bob\s*World/i.test(text)) bankName = 'Bank of Baroda';
  else if (/HDFC/i.test(text)) bankName = 'HDFC Bank';
  else if (/ICICI|ICIC/i.test(text)) bankName = 'ICICI Bank';
  else if (/SBI|State Bank/i.test(text)) bankName = 'State Bank of India';
  else if (/IDFC|IDFB/i.test(text)) bankName = 'IDFC First Bank';
  else if (/Axis|UTIB/i.test(text)) bankName = 'Axis Bank';
  else if (/Yes\s*Bank|YESB/i.test(text)) bankName = 'Yes Bank';
  else if (/Paytm/i.test(text)) bankName = 'Paytm Payments Bank';
  else if (/IndusInd|INDB/i.test(text)) bankName = 'IndusInd Bank';

  let summary = `${bankName}: `;
  if (txnType === 'credit' && amount) {
    summary += `Credited ₹${amount.toLocaleString('en-IN')}`;
    if (utr) summary += ` (Ref ${utr})`;
  } else if (txnType === 'debit' && amount) {
    summary += `Debited ₹${amount.toLocaleString('en-IN')}`;
    if (utr) summary += ` (Ref ${utr})`;
  } else {
    summary += `Balance Check`;
  }
  if (availableBalance !== null) {
    summary += ` | Avl Bal: ₹${availableBalance.toLocaleString('en-IN')}`;
  }

  return {
    bankName,
    accountNumber,
    txnType,
    amount,
    availableBalance,
    utr,
    remitter,
    rawText: text,
    summary,
  };
}
