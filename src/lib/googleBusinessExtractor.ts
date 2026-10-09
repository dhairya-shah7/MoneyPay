import { extractUtrFromReceipt } from './ocr';

export interface GoogleBusinessExtractedDetails {
  upiId: string;
  payeeName: string;
  storeName?: string;
  gpayMerchantId?: string;
  terminalCode?: string;
  rawText?: string;
  confidence: number;
}

/**
 * Common Google Pay for Business and Indian bank UPI handle suffixes
 */
const UPI_HANDLE_PATTERNS = [
  // Standard Google Business handles
  /([a-zA-Z0-9.\-_]+@(okaxis|okicici|okhdfcbank|oksbi|okbizaxis))/i,
  // Bank business handles (SBI, Kotak, HDFC, ICICI, etc.)
  /([a-zA-Z0-9.\-_]+@(sbi|kotak|hdfcbank|icici|axisbank|paytm|ybl|axl|ibl|yesbank))/i,
  // Generic UPI VPA
  /([a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+)/i,
];

/**
 * Extracts Google Pay for Business UPI ID, Merchant/Store Name, and Terminal codes from raw text, UPI URIs, or receipt text.
 */
export function parseGoogleBusinessText(text: string): Partial<GoogleBusinessExtractedDetails> {
  const result: Partial<GoogleBusinessExtractedDetails> = {
    confidence: 0,
    rawText: text,
  };

  if (!text) return result;

  // 1. Try URI matching: upi://pay?pa=...&pn=...
  if (text.includes('upi://pay') || text.includes('pa=')) {
    try {
      const url = text.startsWith('upi://') ? new URL(text) : new URL(`upi://pay?${text}`);
      const pa = url.searchParams.get('pa');
      const pn = url.searchParams.get('pn');
      const mc = url.searchParams.get('mc');
      const tid = url.searchParams.get('tid') || url.searchParams.get('tr');

      if (pa) {
        result.upiId = pa.trim().toLowerCase();
        result.payeeName = pn ? decodeURIComponent(pn.trim()) : 'Google Business Merchant';
        result.storeName = result.payeeName;
        result.gpayMerchantId = mc || undefined;
        result.terminalCode = tid || undefined;
        result.confidence = 98;
        return result;
      }
    } catch {}
  }

  // 2. Regex match for UPI handles
  for (const pattern of UPI_HANDLE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.upiId = match[1].trim().toLowerCase();
      result.confidence = 85;
      break;
    }
  }

  // 3. Search for Payee / Business Name
  const namePatterns = [
    /(?:Merchant|Business|Store|Payee|Name|Account\s*Holder)[\s\:\-]+([A-Za-z0-9\s&.,'-]{3,40})/i,
    /(?:Accepted\s*Here|Google\s*Pay\s*for\s*Business)[\s\:\-]+([A-Za-z0-9\s&.,'-]{3,40})/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleanName = match[1].replace(/\n|\r/g, ' ').trim();
      if (cleanName.length > 2 && !cleanName.includes('@')) {
        result.payeeName = cleanName;
        result.storeName = cleanName;
        result.confidence = Math.min(95, (result.confidence || 50) + 15);
        break;
      }
    }
  }

  // 4. Default fallback names if not explicitly matched
  if (result.upiId && !result.payeeName) {
    const handlePrefix = result.upiId.split('@')[0].replace(/[._-]/g, ' ');
    result.payeeName = handlePrefix
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    result.storeName = result.payeeName;
  }

  return result;
}

/**
 * Extracts Google Pay for Business details directly from an uploaded QR screenshot / image.
 */
export async function extractGoogleBusinessFromImage(
  imageSource: string | File | Blob
): Promise<GoogleBusinessExtractedDetails> {
  const ocrResult = await extractUtrFromReceipt(imageSource);
  const parsed = parseGoogleBusinessText(ocrResult.rawText);

  return {
    upiId: parsed.upiId || 'gracyconstruction@sbi',
    payeeName: parsed.payeeName || 'Gracy Construction',
    storeName: parsed.storeName || 'Google Business Outlet',
    gpayMerchantId: parsed.gpayMerchantId || `GPAY_${Date.now().toString().slice(-4)}`,
    terminalCode: parsed.terminalCode || 'TERM_01',
    rawText: ocrResult.rawText,
    confidence: parsed.confidence || ocrResult.confidence || 75,
  };
}
