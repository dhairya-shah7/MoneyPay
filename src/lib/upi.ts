export interface UpiPaymentDetails {
  pa: string; // Payee VPA (UPI ID)
  pn: string; // Payee Name
  am?: string | number; // Amount (Optional: when omitted, generates Static/Open QR)
  cu?: string; // Currency, default INR
  tn?: string; // Note / Description
  tr?: string; // Transaction Reference ID
}

export function generateUpiUri(details: UpiPaymentDetails): string {
  const pa = details.pa.trim();
  const pn = encodeURIComponent(details.pn.trim());
  const cu = details.cu || "INR";
  const tn = details.tn ? `&tn=${encodeURIComponent(details.tn.trim())}` : '';

  if (details.am !== undefined && details.am !== null && details.am !== '' && Number(details.am) > 0) {
    const am = parseFloat(details.am.toString()).toFixed(2);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}${tn}`;
  }

  // Static / Open-Amount UPI QR (Amount to be filled by the retailer / customer)
  return `upi://pay?pa=${pa}&pn=${pn}&cu=${cu}${tn}`;
}

export function generateStaticUpiUri(details: { pa: string; pn: string; cu?: string; tn?: string }): string {
  const pa = details.pa.trim();
  const pn = encodeURIComponent(details.pn.trim());
  const cu = details.cu || "INR";
  const tn = details.tn ? `&tn=${encodeURIComponent(details.tn.trim())}` : '';
  return `upi://pay?pa=${pa}&pn=${pn}&cu=${cu}${tn}`;
}

export interface UpiAppIntent {
  name: string;
  id: 'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'cred' | 'generic';
  icon: string;
  scheme: (uri: string) => string;
}

export const UPI_APPS: UpiAppIntent[] = [
  {
    name: "PhonePe",
    id: "phonepe",
    icon: "/icons/phonepe.svg",
    scheme: (uri: string) => `phonepe://pay?${uri.split('?')[1]}`,
  },
  {
    name: "Google Pay",
    id: "gpay",
    icon: "/icons/gpay.svg",
    scheme: (uri: string) => `gpay://upi/pay?${uri.split('?')[1]}`,
  },
  {
    name: "Paytm",
    id: "paytm",
    icon: "/icons/paytm.svg",
    scheme: (uri: string) => `paytmmp://pay?${uri.split('?')[1]}`,
  },
  {
    name: "BHIM UPI",
    id: "bhim",
    icon: "/icons/bhim.svg",
    scheme: (uri: string) => `bhim://pay?${uri.split('?')[1]}`,
  },
  {
    name: "Cred",
    id: "cred",
    icon: "/icons/cred.svg",
    scheme: (uri: string) => `credpay://upi/pay?${uri.split('?')[1]}`,
  },
  {
    name: "Any UPI App",
    id: "generic",
    icon: "/icons/upi.svg",
    scheme: (uri: string) => uri,
  },
];
