'use client';

import React, { useState } from 'react';
import {
  Code2,
  Key,
  Webhook,
  Copy,
  Check,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Terminal,
} from 'lucide-react';

export default function DevelopersPage() {
  const [apiKey] = useState('mp_live_k928f01a89c20a1e3bf89');
  const [apiSecret] = useState('mp_sec_89df201ba873910c28479e0189');
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:3000/api/v1/admin/webhooks/test-receiver');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook Tester State
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);

  const copyToClip = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(field);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookResult(null);

    try {
      const res = await fetch('/api/v1/admin/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret: apiSecret,
        }),
      });

      const data = await res.json();
      setWebhookResult(data);
    } catch (err: any) {
      setWebhookResult({
        success: false,
        status: 500,
        responseBody: err?.message || 'Network error sending test webhook',
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const curlExample = `curl -X POST "http://localhost:3000/api/v1/payin/create" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{
    "amount": 500,
    "merchant_order_id": "ORD_${Date.now()}",
    "user_id": "PLAYER_101",
    "customer_name": "Rahul Kumar",
    "customer_phone": "+919876543210"
  }'`;

  const nodeExample = `const axios = require('axios');

async function createDeposit() {
  const response = await axios.post('http://localhost:3000/api/v1/payin/create', {
    amount: 500,
    merchant_order_id: 'ORD_99182',
    user_id: 'PLAYER_101',
    customer_name: 'Rahul Kumar'
  }, {
    headers: {
      'X-API-Key': '${apiKey}',
      'Content-Type': 'application/json'
    }
  });

  console.log('Redirect User to:', response.data.checkout_url);
}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Developer Studio & Webhooks</h1>
        <p className="text-xs text-slate-500 font-medium">
          Integrate MoneyPay into your application with high-speed APIs and real-time HMAC-signed webhooks.
        </p>
      </div>

      {/* API Credentials */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-600" />
          <span>API Credentials & Authentication</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700">Public API Key (X-API-Key)</span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900">
              <span className="truncate mr-2">{apiKey}</span>
              <button
                onClick={() => copyToClip('key', apiKey)}
                className="text-slate-400 hover:text-slate-700 shrink-0"
              >
                {copiedKey === 'key' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700">API Secret (HMAC Signing)</span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900">
              <span className="truncate mr-2">{apiSecret}</span>
              <button
                onClick={() => copyToClip('sec', apiSecret)}
                className="text-slate-400 hover:text-slate-700 shrink-0"
              >
                {copiedKey === 'sec' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Studio & Tester */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Webhook className="w-4 h-4 text-indigo-600" />
            <span>Webhook Simulator & Delivery Tester</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">HMAC-SHA256 Signed</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Merchant Callback / Webhook Endpoint</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleTestWebhook}
                disabled={isTestingWebhook}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-indigo-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingWebhook ? 'Delivering...' : 'Send Test Webhook'}</span>
              </button>
            </div>
          </div>

          {/* Webhook Result Inspector */}
          {webhookResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {webhookResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-bold text-slate-900">
                    Response Status: <span className="font-mono">{webhookResult.status}</span>
                  </span>
                </div>
                {webhookResult.latencyMs && (
                  <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    <span>{webhookResult.latencyMs}ms latency</span>
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold font-mono">Dispatched Signature (X-MoneyPay-Signature):</span>
                <div className="p-2 bg-white rounded font-mono text-[10px] text-emerald-800 break-all border border-slate-200 font-bold">
                  {webhookResult.signature}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold font-mono">Delivered Payload:</span>
                <pre className="p-3 bg-white rounded text-[11px] font-mono text-slate-900 overflow-x-auto border border-slate-200">
                  {JSON.stringify(webhookResult.payload, null, 2)}
                </pre>
              </div>

              {webhookResult.responseBody && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold font-mono">Endpoint Server Response:</span>
                  <div className="p-2 bg-white rounded text-[11px] font-mono text-slate-700 border border-slate-200">
                    {webhookResult.responseBody}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-600" />
          <span>Quickstart Code Snippets</span>
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">cURL Request</span>
              <button
                onClick={() => copyToClip('curl', curlExample)}
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-[11px] font-semibold"
              >
                {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy cURL</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto shadow-inner">
              {curlExample}
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Node.js (Axios)</span>
              <button
                onClick={() => copyToClip('node', nodeExample)}
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-[11px] font-semibold"
              >
                {copiedKey === 'node' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy Node.js</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-indigo-300 overflow-x-auto shadow-inner">
              {nodeExample}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
