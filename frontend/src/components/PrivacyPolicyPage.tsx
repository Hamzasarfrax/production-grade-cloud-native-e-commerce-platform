import React from 'react';
import { ShieldCheck, Lock, FileText, Printer, CheckCircle2, RotateCcw, Truck } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Legal & Business Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Privacy Policy & Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Official business policy, PCI-DSS payment compliance standards, warranty guidelines, and 30-day return policy for <b>Mxmobilz Inc</b>.
          </p>
        </div>

        {/* Policy Document Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 text-xs text-slate-700 leading-relaxed font-medium">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Document Ref</span>
              <div className="font-mono font-black text-slate-900 text-sm">MXMOBILZ-LEGAL-2026-V4</div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Printer className="w-4 h-4 text-slate-600" /> Print Policy
            </button>
          </div>

          {/* Section 1: Data Privacy & Security */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 text-blue-600">
              <ShieldCheck className="w-4 h-4" /> 1. Customer Data Privacy & Encryption
            </h2>
            <p>
              Mxmobilz Inc. respects customer privacy and strictly adheres to global data privacy laws including GDPR and CCPA. All sensitive customer information, shipping addresses, and personal contact details are stored in 256-bit AES encrypted databases. We NEVER sell, rent, or trade your personal data to third-party marketers or brokers.
            </p>
          </section>

          {/* Section 2: PCI-DSS Payment Processing */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 text-emerald-600">
              <Lock className="w-4 h-4" /> 2. Payment Security & PCI-DSS Compliance
            </h2>
            <p>
              Online orders processed through Mxmobilz utilize Level 1 PCI-DSS compliant payment gateways with SSL/TLS encryption. Full credit card numbers are never stored on our web servers. Express payment tokens (Apple Pay, Google Pay) are tokenized directly with your card provider.
            </p>
          </section>

          {/* Section 3: 1-Year Mobile Warranty */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 text-indigo-600">
              <FileText className="w-4 h-4" /> 3. Official 1-Year Device Warranty Policy
            </h2>
            <p>
              All brand new flagship smartphones (Apple iPhone, Samsung Galaxy, Google Pixel, OnePlus) carry a 1-Year Official Manufacturer Warranty. In addition, certified refurbished devices purchased from Mxmobilz include a 1-Year Store Replacement Warranty covering hardware failures, touchscreen defects, and battery health drops below 80%.
            </p>
          </section>

          {/* Section 4: 30-Day Express Returns */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 text-rose-600">
              <RotateCcw className="w-4 h-4" /> 4. 30-Day Return & Refund Terms
            </h2>
            <p>
              Customers may return unopened or defective mobile devices within 30 days of delivery for a full refund or exchange. Returned items must include original accessories, factory packaging, and IMEI match certification. Prepaid insured shipping labels are provided by customer support.
            </p>
          </section>

          {/* Section 5: Trade-In Valuation Rules */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 text-amber-600">
              <Truck className="w-4 h-4" /> 5. Trade-In Valuation & Device Inspection
            </h2>
            <p>
              Trade-In credit estimates provided on Mxmobilz are locked for 14 days. Final credit value is finalized upon receipt and physical inspection of the old device at our inspection center. Devices with reported lost/stolen blacklist status or active Find My / iCloud locks will be returned to sender.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 font-semibold text-center">
            Last Updated: August 12, 2026 • Mxmobilz Legal Department, New York, NY
          </div>

        </div>

      </div>
    </div>
  );
};
