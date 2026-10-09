import React, { useState } from 'react';
import {
  CheckCircle2,
  UploadCloud,
  X,
  HelpCircle,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Scan,
} from 'lucide-react';
import { extractUtrFromReceipt } from '@/lib/ocr';

interface UtrFormProps {
  initialUtr?: string;
  initialScreenshot?: string;
  orderAmount?: number;
  isSubmitting: boolean;
  onSubmit: (utr: string, screenshotBase64?: string, paidAmount?: string) => Promise<void>;
  status: string;
}

export function UtrSubmissionForm({
  initialUtr = '',
  initialScreenshot = '',
  orderAmount = 0,
  isSubmitting,
  onSubmit,
  status,
}: UtrFormProps) {
  const [utr, setUtr] = useState<string>(initialUtr);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [screenshot, setScreenshot] = useState<string>(initialScreenshot);
  const [isScanningOcr, setIsScanningOcr] = useState<boolean>(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState<string>('');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    setUtr(cleaned);
    setErrorMsg('');
    setOcrSuccessMsg('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 8MB');
      return;
    }

    // Convert to base64 preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-OCR Scan
    setIsScanningOcr(true);
    setErrorMsg('');
    try {
      const scanRes = await extractUtrFromReceipt(file);
      if (scanRes.utr) {
        setUtr(scanRes.utr);
        setOcrSuccessMsg(`Auto-detected 12-digit UTR: ${scanRes.utr}`);
      }
    } catch (ocrErr) {
      console.log('OCR scan issue:', ocrErr);
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      if (cleaned) {
        setUtr(cleaned);
        setErrorMsg('');
      }
    } catch (err) {
      console.log('Clipboard paste not allowed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || utr.length < 10) {
      setErrorMsg('Please enter a valid 12-digit UTR / Transaction Reference Number');
      return;
    }
    setErrorMsg('');
    await onSubmit(utr, screenshot, paidAmount);
  };

  const isAlreadySubmitted = status === 'VERIFYING' || status === 'SUCCESS';

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
            2
          </span>
          <h3 className="text-sm font-bold text-slate-900">
            Submit 12-Digit UTR / Ref No.
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Where is UTR?</span>
        </button>
      </div>

      {showHelp && (
        <div className="p-3.5 rounded-xl bg-indigo-50/90 border border-indigo-100 text-xs text-slate-800 space-y-2 animate-fade-in">
          <p className="font-bold text-indigo-950">How to find your 12-digit UTR:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-700">
            <li><strong className="text-slate-900">Google Pay:</strong> Tap payment details & copy "UPI transaction ID" (12 digits).</li>
            <li><strong className="text-slate-900">PhonePe:</strong> View history & copy "UTR" number.</li>
            <li><strong className="text-slate-900">Paytm:</strong> Check under "UPI Ref No".</li>
            <li><strong className="text-slate-900">NetBanking / IMPS:</strong> Check the SMS / receipt for IMPS Reference Number.</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Screenshot Upload with Auto-OCR */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>Payment Screenshot</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                Auto-OCR Scanner
              </span>
            </label>
            <span className="text-[10px] text-emerald-700 font-semibold">1-Sec Auto Detection</span>
          </div>

          {screenshot ? (
            <div className="relative rounded-xl border border-slate-200 p-2.5 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3 truncate">
                <img
                  src={screenshot}
                  alt="Receipt Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-300 shadow-sm"
                />
                <div className="truncate text-xs">
                  <span className="font-bold text-slate-900 block truncate">
                    Payment_Receipt.jpg
                  </span>
                  {isScanningOcr ? (
                    <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                      <Scan className="w-3 h-3 animate-spin" />
                      Scanning receipt for 12-digit UTR...
                    </span>
                  ) : ocrSuccessMsg ? (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {ocrSuccessMsg}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Image attached</span>
                  )}
                </div>
              </div>

              {!isAlreadySubmitted && (
                <button
                  type="button"
                  onClick={() => {
                    setScreenshot('');
                    setOcrSuccessMsg('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <label className={`border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/30 ${isAlreadySubmitted ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div className="text-center sm:text-left">
                <span className="text-xs font-semibold text-slate-800 block">
                  Upload screenshot for Auto-UTR detection
                </span>
                <span className="text-[10px] text-slate-500">
                  PNG, JPG, JPEG up to 8MB
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isSubmitting || isAlreadySubmitted}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Open Amount: Enter amount paid if not predefined */}
        {orderAmount <= 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>Amount Paid (₹ INR)</span>
              <span className="text-[10px] text-slate-400 font-medium">As sent in UPI App</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="e.g. 500"
                disabled={isSubmitting || isAlreadySubmitted}
                className="w-full pl-8 pr-4 py-2.5 text-sm font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </div>
        )}

        {/* UTR Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
            <span>UTR / UPI Reference Number (12 Digits)</span>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">{utr.length}/12</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={utr}
              onChange={handleUtrChange}
              placeholder="e.g. 428901829381"
              maxLength={12}
              disabled={isSubmitting || isAlreadySubmitted}
              className={`w-full px-4 py-3 text-base font-mono tracking-wider font-bold rounded-xl border ${
                utr.length === 12
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 text-emerald-900'
                  : 'border-slate-300 bg-white text-slate-900'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 placeholder:font-normal`}
            />

            <div className="absolute right-2.5 flex items-center gap-1.5">
              {!isAlreadySubmitted && (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors border border-slate-200"
                >
                  Paste
                </button>
              )}
              {utr.length === 12 && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-fade-in" />
              )}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || utr.length < 10 || isAlreadySubmitted}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
            isAlreadySubmitted
              ? 'bg-blue-600 text-white cursor-default'
              : utr.length >= 10 && !isSubmitting
              ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-600/20 active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Verification...</span>
            </>
          ) : isAlreadySubmitted ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Verifying with Banking Network...</span>
            </>
          ) : (
            <>
              <span>Confirm & Verify Deposit</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
