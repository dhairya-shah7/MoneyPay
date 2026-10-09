export interface ParsedBankTransaction {
  bankName?: string;
  accountNumber?: string;
  amount: number | null;
  availableBalance: number | null;
  utr: string | null;
  remitter?: string | null;
  rawText: string;
}

export function parseBankSms(smsText: string): ParsedBankTransaction {
  const text = smsText.trim();

  // 1. Extract 12-digit UTR / UPI Reference Number
  let utr: string | null = null;
  const utrPatterns = [
    /(?:UPI\/|Ref(?:erence)?\s*(?:No\.?|num)?\s*[:\-]?\s*|UTR\s*[:\-]?\s*|Txn\s*ID\s*[:\-]?\s*|RRN\s*[:\-]?\s*)(\d{12})/i,
    /(?:UPI\s+Ref\s+No\s*)(\d{12})/i,
    /(?:IMPS\/|NEFT\/|RTGS\/)(\d{12})/i,
    /(?:\b|\D)(\d{12})(?:\b|\D)/, // fallback 12 digit number
  ];

  for (const pattern of utrPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      utr = match[1];
      break;
    }
  }

  // 2. Extract Live Available Bank Balance (Avl Bal / Available Balance / Bal)
  let availableBalance: number | null = null;
  const balancePatterns = [
    /(?:Avl\.?\s*Bal(?:ance)?|Available\s*Bal(?:ance)?|Clear\s*Bal(?:ance)?|Updated\s*Bal(?:ance)?|Total\s*Bal(?:ance)?|A\/c\s*Bal(?:ance)?)\s*(?:in\s+your\s+[A-Za-z0-9\s\/\*xX]+?)?(?:is)?\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Bal(?:ance)?)\s*(?:is)?\s*[:\-]\s*(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Avl\.?\s*Bal(?:ance)?|Available\s*Bal(?:ance)?)\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
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

  const textWithoutBalance = text.replace(
    /(?:Avl\.?\s*Bal(?:ance)?|Available\s*Bal(?:ance)?|Clear\s*Bal(?:ance)?|Updated\s*Bal(?:ance)?|Total\s*Bal(?:ance)?|A\/c\s*Bal(?:ance)?).*$/i,
    ''
  );

  // 3. Extract Amount
  let amount: number | null = null;
  const amountPatterns = [
    /(?:credited\s+(?:by|with|for)?\s*(?:Rs\.?|INR|₹)?\s*|deposited\s*(?:Rs\.?|INR|₹)?\s*|received\s*(?:Rs\.?|INR|₹)?\s*)([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:is\s+)?credited/i,
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
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

  // 4. Extract Account Number slice
  let accountNumber: string | undefined = undefined;
  const accMatch = text.match(/(?:A\/c|AC|Acct|Account)\s*(?:No\.?)?\s*[\*xX]*(\d{3,10})/i);
  if (accMatch && accMatch[1]) {
    accountNumber = accMatch[1];
  }

  // 5. Identify Bank Name
  let bankName: string | undefined = undefined;
  if (/Kotak|KKBK/i.test(text)) bankName = 'Kotak Mahindra Bank';
  else if (/HDFC/i.test(text)) bankName = 'HDFC Bank';
  else if (/ICICI/i.test(text)) bankName = 'ICICI Bank';
  else if (/SBI|State Bank/i.test(text)) bankName = 'State Bank of India';
  else if (/Axis/i.test(text)) bankName = 'Axis Bank';
  else if (/Yes\s*Bank/i.test(text)) bankName = 'Yes Bank';
  else if (/Paytm/i.test(text)) bankName = 'Paytm Payments Bank';
  else if (/IndusInd/i.test(text)) bankName = 'IndusInd Bank';
  else bankName = 'Kotak Mahindra Bank';

  return {
    bankName,
    accountNumber,
    amount,
    availableBalance,
    utr,
    rawText: text,
  };
}
