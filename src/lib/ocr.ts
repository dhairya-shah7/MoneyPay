import { createWorker } from 'tesseract.js';

export interface OcrScanResult {
  utr: string | null;
  confidence: number;
  rawText: string;
}

export async function extractUtrFromReceipt(imageSource: string | File | Blob): Promise<OcrScanResult> {
  let worker = null;
  try {
    worker = await createWorker('eng');
    
    // Recognize text
    const ret = await worker.recognize(imageSource);
    const text = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    await worker.terminate();

    // Search for 12-digit UTR patterns in Indian receipts
    const utrPatterns = [
      /(?:UPI\s*(?:transaction\s*id|Ref(?:\s*No)?|ID)|UTR|Txn\s*ID|Ref\s*No|RRN|Reference)[\s\:\.\#-]*([0-9]{12})/i,
      /(?:Google\s*Pay|PhonePe|Paytm|BHIM|CRED)[\s\S]*?([0-9]{12})/i,
      /(?:\b|\D)([0-9]{12})(?:\b|\D)/, // fallback 12 digits
    ];

    let extractedUtr: string | null = null;
    for (const pattern of utrPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedUtr = match[1];
        break;
      }
    }

    return {
      utr: extractedUtr,
      confidence,
      rawText: text,
    };
  } catch (error) {
    console.error('[OCR Error]:', error);
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {}
    }
    return {
      utr: null,
      confidence: 0,
      rawText: '',
    };
  }
}
