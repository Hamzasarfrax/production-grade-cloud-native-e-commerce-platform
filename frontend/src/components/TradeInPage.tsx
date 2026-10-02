import React, { useState } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  ArrowRight, 
  DollarSign, 
  Sparkles, 
  Printer, 
  Copy,
  Check
} from 'lucide-react';
import { ViewMode } from '../types';

interface TradeInPageProps {
  setCurrentView: (view: ViewMode) => void;
  setSelectedBrand: (brand: string) => void;
}

export const TradeInPage: React.FC<TradeInPageProps> = ({ setCurrentView, setSelectedBrand }) => {
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('iPhone 14 Pro 128GB');
  const [condition, setCondition] = useState<'Flawless' | 'Good' | 'Fair' | 'Damaged'>('Flawless');
  const [carrier, setCarrier] = useState('Factory Unlocked');
  const [quoteCalculated, setQuoteCalculated] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const calculateQuote = () => {
    let price = 300;
    if (model.includes('15')) price = 550;
    if (model.includes('14 Pro')) price = 480;
    if (model.includes('13')) price = 320;
    if (model.includes('S24')) price = 520;
    if (model.includes('S23')) price = 390;
    if (model.includes('Pixel 8')) price = 350;

    if (condition === 'Flawless') price += 80;
    if (condition === 'Good') price += 40;
    if (condition === 'Damaged') price -= 120;

    return Math.max(80, price);
  };

  const finalQuote = calculateQuote();
  const tradeCode = `MXTRADE-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(tradeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider">
            <RefreshCw className="w-3.5 h-3.5" /> Instant Trade-In Value Guarantee
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Exchange Your Used Phone For Credit
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Get top dollar for your current mobile device. We provide free shipping, 14-day price lock, and instant checkout discounts.
          </p>
        </div>

        {/* Interactive Estimator Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Brand Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">1. Select Device Brand</label>
              <div className="grid grid-cols-3 gap-2">
                {['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'].map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    className={`p-3 text-center rounded-xl border text-xs font-bold transition cursor-pointer ${
                      brand === b 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">2. Select Model & Storage</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
              >
                {brand === 'Apple' && (
                  <>
                    <option value="iPhone 15 Pro Max 256GB">iPhone 15 Pro Max 256GB</option>
                    <option value="iPhone 15 Pro 128GB">iPhone 15 Pro 128GB</option>
                    <option value="iPhone 14 Pro Max 256GB">iPhone 14 Pro Max 256GB</option>
                    <option value="iPhone 14 Pro 128GB">iPhone 14 Pro 128GB</option>
                    <option value="iPhone 13 Pro 128GB">iPhone 13 Pro 128GB</option>
                    <option value="iPhone 12 64GB">iPhone 12 64GB</option>
                  </>
                )}
                {brand === 'Samsung' && (
                  <>
                    <option value="Samsung Galaxy S24 Ultra 256GB">Samsung Galaxy S24 Ultra 256GB</option>
                    <option value="Samsung Galaxy S23 Ultra 256GB">Samsung Galaxy S23 Ultra 256GB</option>
                    <option value="Samsung Galaxy Z Fold 5 256GB">Samsung Galaxy Z Fold 5 256GB</option>
                  </>
                )}
                {brand !== 'Apple' && brand !== 'Samsung' && (
                  <>
                    <option value="Google Pixel 8 Pro 128GB">Google Pixel 8 Pro 128GB</option>
                    <option value="OnePlus 12 256GB">OnePlus 12 256GB</option>
                  </>
                )}
              </select>
            </div>

            {/* Condition Questionnaire */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">3. Physical Device Condition</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Flawless', desc: 'No scratches, 100% working' },
                  { label: 'Good', desc: 'Minor scuffs, functional' },
                  { label: 'Fair', desc: 'Visible wear, good screen' },
                  { label: 'Damaged', desc: 'Cracked glass or defects' }
                ].map(cond => (
                  <button
                    key={cond.label}
                    type="button"
                    onClick={() => setCondition(cond.label as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      condition === cond.label 
                        ? 'bg-blue-50 border-blue-600 text-blue-800 font-bold shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-slate-900">{cond.label}</div>
                    <div className="text-[10px] text-slate-500 mt-1 font-medium">{cond.desc}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Calculate Quote Button / Result Box */}
          <div className="pt-4 border-t border-slate-200">
            {!quoteCalculated ? (
              <button
                onClick={() => setQuoteCalculated(true)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md transition cursor-pointer"
              >
                Calculate Instant Cash Offer
              </button>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-emerald-300 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">Your Guaranteed Trade-In Quote</span>
                    <span className="text-4xl font-black text-emerald-600">${finalQuote} Credit</span>
                    <p className="text-xs text-slate-700 mt-1">Valid for device: <b>{model}</b> ({condition} condition)</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1 shadow-xs">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase">Trade-In Voucher Code</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-blue-600 text-sm">{tradeCode}</span>
                      <button onClick={handleCopyCode} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedBrand('All');
                      setCurrentView('shop');
                    }}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    Apply Credit To New Phone <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-600" /> Print Free Shipping Label
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
