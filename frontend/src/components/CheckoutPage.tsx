import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  ArrowLeft, 
  Building2, 
  Smartphone,
  Apple,
  MapPin
} from 'lucide-react';
import { CartItem, Order, ShippingDetails, PromoCode, ViewMode } from '../types';

interface CheckoutPageProps {
  cartItems: CartItem[];
  setCurrentView: (view: ViewMode) => void;
  appliedPromo: PromoCode | null;
  clearCart: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  setCurrentView,
  appliedPromo,
  clearCart,
  onOrderPlaced
}) => {
  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: 'David Miller',
    email: 'david.miller@techmail.com',
    phone: '+1 (555) 342-1098',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    country: 'United States'
  });

  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express' | 'overnight'>('express');
  const [paymentMethod, setPaymentMethod] = useState<'Credit/Debit Card' | 'Apple Pay' | 'Google Pay' | 'Cash on Delivery'>('Credit/Debit Card');
  
  // Credit Card details simulation
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvc, setCardCvc] = useState('892');

  const rawSubtotal = cartItems.reduce((sum, item) => {
    let base = item.product.price;
    if (item.selectedStorage === '256GB') base += 100;
    if (item.selectedStorage === '512GB') base += 250;
    if (item.selectedStorage === '1TB') base += 450;
    if (item.warrantySelected) base += 99;
    return sum + base * item.quantity;
  }, 0);

  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'fixed') {
      discountAmount = appliedPromo.discountValue;
    } else {
      discountAmount = Math.round((rawSubtotal * appliedPromo.discountValue) / 100);
    }
  }

  let shippingFee = 0;
  if (deliveryMethod === 'overnight') shippingFee = 25;

  const tax = Math.round((rawSubtotal - discountAmount) * 0.08);
  const totalAmount = Math.max(0, rawSubtotal - discountAmount + shippingFee + tax);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const newOrder: Order = {
      id: `MX-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString().split('T')[0],
      shippingDetails: shipping,
      items: cartItems,
      subtotal: rawSubtotal,
      discount: discountAmount,
      shippingFee,
      tax,
      totalAmount,
      status: 'Processing',
      paymentMethod,
      trackingNumber: `MXEXP${Math.floor(1000000 + Math.random() * 9000000)}US`,
      appliedPromo: appliedPromo?.code
    };

    onOrderPlaced(newOrder);
    clearCart();
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-slate-50 min-h-screen py-16 text-center text-slate-600">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Shopping Cart Is Empty</h2>
        <p className="text-xs text-slate-500 mb-6">Please add mobile phones to your cart before proceeding to checkout.</p>
        <button onClick={() => setCurrentView('shop')} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 cursor-pointer shadow-md">
          Return To Mobile Shop Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation back */}
        <button
          onClick={() => setCurrentView('shop')}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Mobile Shop
        </button>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">
          Secure Mobile Checkout
        </h1>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Customer Contact & Address */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                1. Contact & Express Shipping Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={shipping.fullName}
                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={shipping.email}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone (Order Updates)</label>
                  <input
                    type="tel"
                    required
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State / Zip Code</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={shipping.state}
                      onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                    />
                    <input
                      type="text"
                      required
                      value={shipping.zipCode}
                      onChange={(e) => setShipping({ ...shipping, zipCode: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Options */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                <Truck className="w-4 h-4 text-emerald-600" />
                2. Select Dispatch Delivery Speed
              </h3>

              <div className="space-y-2 text-xs">
                {[
                  { id: 'express', name: 'Mxmobilz 24h Express Air Courier', speed: '1-2 Business Days', fee: '$0 Free' },
                  { id: 'overnight', name: 'VIP Priority Overnight Delivery', speed: 'Next Day Morning', fee: '+$25' }
                ].map(opt => (
                  <label 
                    key={opt.id}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      deliveryMethod === opt.id ? 'bg-blue-50 border-blue-600 text-slate-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === opt.id}
                        onChange={() => setDeliveryMethod(opt.id as any)}
                        className="accent-blue-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{opt.name}</div>
                        <div className="text-[10px] text-slate-500">{opt.speed}</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">{opt.fee}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                <Lock className="w-4 h-4 text-amber-500" />
                3. Encrypted Payment Details
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {['Credit/Debit Card', 'Apple Pay', 'Google Pay', 'Cash on Delivery'].map(pm => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm as any)}
                    className={`p-2.5 rounded-xl border font-bold text-center transition cursor-pointer ${
                      paymentMethod === pm 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>

              {paymentMethod === 'Credit/Debit Card' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">CVV Security</label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-amber-300" /> Pay ${totalAmount} & Place Mobile Order
            </button>

          </div>

          {/* Right Order Summary Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 sticky top-20">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
                Order Summary ({cartItems.reduce((a, b) => a + b.quantity, 0)})
              </h3>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-contain bg-slate-50 border border-slate-200 p-1 rounded-lg" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.product.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{item.selectedStorage} • {item.selectedColor.name}</div>
                    </div>
                    <span className="font-bold text-blue-600">${item.product.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Items Subtotal:</span>
                  <span className="font-bold text-slate-900">${rawSubtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Code ({appliedPromo?.code}):</span>
                    <span>-${discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Shipping:</span>
                  <span className="font-bold text-emerald-600">{shippingFee > 0 ? `$${shippingFee}` : 'FREE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Estimated Sales Tax:</span>
                  <span className="font-bold text-slate-700">${tax}</span>
                </div>
                <div className="flex justify-between text-base font-black pt-3 border-t border-slate-200 text-slate-900">
                  <span>Total Due Today:</span>
                  <span className="text-blue-600">${totalAmount}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <ShieldCheck className="w-4 h-4" /> 100% Genuine Mobile Guarantee
                </div>
                <p>Every phone is double-checked and shipped in factory sealed box with 1-Year official warranty.</p>
              </div>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
