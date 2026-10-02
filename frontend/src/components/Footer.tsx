import React, { useState } from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Headphones, 
  Mail, 
  MapPin, 
  Phone, 
  Send, 
  CheckCircle,
  Lock,
  CreditCard
} from 'lucide-react';
import { ViewMode } from '../types';

interface FooterProps {
  setCurrentView: (view: ViewMode) => void;
  setSelectedBrand: (brand: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView, setSelectedBrand }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200 pt-16">
      {/* Value Proposition Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Free Express Shipping</h4>
              <p className="text-xs text-slate-500 mt-0.5">On all flagship orders over $499</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">1-Year Official Warranty</h4>
              <p className="text-xs text-slate-500 mt-0.5">100% genuine original devices</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">30-Day Money Back</h4>
              <p className="text-xs text-slate-500 mt-0.5">Hassle-free return & replacement</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">24/7 Mobile Specialists</h4>
              <p className="text-xs text-slate-500 mt-0.5">Live expert consultation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('landing')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Mx<span className="text-blue-600">mobilz</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed pr-4">
            Mxmobilz is the premier authorized digital destination for authentic Apple iPhones, Samsung Galaxy flagships, Google Pixel, and high-performance Android devices with trade-in guarantee and express dispatch.
          </p>

          <div className="space-y-2 text-xs text-slate-600 pt-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>450 Fifth Avenue, Midtown Tech District, New York, NY 10018</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>+1 (800) 555-MXMOBILZ / +1 (212) 555-0199</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>support@mxmobilz.com</span>
            </div>
          </div>
        </div>

        {/* Quick Shop Links */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
            Shop Mobiles
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-600 font-medium">
            <li>
              <button 
                onClick={() => { setSelectedBrand('Apple'); setCurrentView('shop'); }}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Apple iPhone 16 Series
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setSelectedBrand('Samsung'); setCurrentView('shop'); }}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Samsung Galaxy S25 Ultra
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setSelectedBrand('Google'); setCurrentView('shop'); }}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Google Pixel 9 Pro XL
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setSelectedBrand('OnePlus'); setCurrentView('shop'); }}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                OnePlus 13 5G
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setSelectedBrand('Nothing'); setCurrentView('shop'); }}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Nothing Phone (2a) Plus
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setSelectedBrand('All'); setCurrentView('shop'); }}
                className="text-blue-600 hover:text-blue-700 font-bold transition cursor-pointer"
              >
                Certified Refurbished
              </button>
            </li>
          </ul>
        </div>

        {/* Navigation & Services */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
            Services & Support
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-600 font-medium">
            <li>
              <button 
                onClick={() => setCurrentView('trade-in')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Trade-In Estimator
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('compare')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Phone Specs Comparison
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('contact')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Contact Store & Locations
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('privacy')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Privacy Policy & Terms
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('admin')}
                className="hover:text-blue-700 transition cursor-pointer flex items-center gap-1 text-blue-600 font-bold"
              >
                Admin Management Portal
              </button>
            </li>
          </ul>
        </div>

        {/* Newsletter & Discount */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
            Get $50 Off Coupon
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Subscribe to Mxmobilz VIP newsletter to get an instant $50 promo code for your first purchase.
          </p>

          {subscribed ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Subscribed Successfully!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Use promo code: <b className="text-white bg-emerald-600 px-1.5 py-0.5 rounded">MXWELCOME50</b> at checkout!</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400">We respect your privacy. Unsubscribe anytime.</p>
            </form>
          )}

          {/* Secure Payment Icons */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" /> Encrypted Checkout
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md">VISA</span>
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md">Mastercard</span>
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md">Apple Pay</span>
              <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md">Google Pay</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="bg-slate-900 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Mxmobilz Inc. All rights reserved. Premium Authorized Mobile Retailer.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentView('privacy')} className="hover:text-white">Privacy Policy</button>
            <button onClick={() => setCurrentView('privacy')} className="hover:text-white">Terms of Service</button>
            <button onClick={() => setCurrentView('contact')} className="hover:text-white">Store Support</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
