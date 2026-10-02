import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ShieldCheck, 
  Tag, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { CartItem, ViewMode, PromoCode } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  updateQuantity: (cartItemId: string, newQty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  setCurrentView: (view: ViewMode) => void;
  appliedPromo: PromoCode | null;
  setAppliedPromo: (promo: PromoCode | null) => void;
  availablePromos: PromoCode[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  updateQuantity,
  removeFromCart,
  setCurrentView,
  appliedPromo,
  setAppliedPromo,
  availablePromos
}) => {
  if (!isOpen) return null;

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const rawSubtotal = cartItems.reduce((sum, item) => {
    let base = item.product.price;
    if (item.selectedStorage === '256GB') base += 100;
    if (item.selectedStorage === '512GB') base += 250;
    if (item.selectedStorage === '1TB') base += 450;
    if (item.warrantySelected) base += 99;
    return sum + base * item.quantity;
  }, 0);

  // Discount calculation
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'fixed') {
      discountAmount = appliedPromo.discountValue;
    } else {
      discountAmount = Math.round((rawSubtotal * appliedPromo.discountValue) / 100);
    }
  }

  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    const found = availablePromos.find(p => p.code === code && p.active);
    
    if (found) {
      if (rawSubtotal < found.minSpend) {
        setPromoError(`Minimum spend of $${found.minSpend} required for this promo.`);
      } else {
        setAppliedPromo(found);
        setPromoInput('');
      }
    } else {
      setPromoError('Invalid promo code. Try MXWELCOME50 or IPHONEPRO100');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl">
        
        {/* Drawer Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-slate-900 text-base">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span>Your Shopping Cart ({cartItems.reduce((a, b) => a + b.quantity, 0)})</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-800">Your cart is empty</p>
              <p className="text-xs">Browse our flagship iPhone and Android mobile inventory to add devices.</p>
            </div>
          ) : (
            cartItems.map(item => {
              let itemPrice = item.product.price;
              if (item.selectedStorage === '256GB') itemPrice += 100;
              if (item.selectedStorage === '512GB') itemPrice += 250;
              if (item.selectedStorage === '1TB') itemPrice += 450;
              if (item.warrantySelected) itemPrice += 99;

              return (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex gap-3 relative">
                  <img 
                    src={item.product.image} 
                    alt={item.product.name} 
                    className="w-16 h-16 object-contain rounded-xl bg-white border border-slate-200 p-1 shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h4>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                        {item.selectedStorage}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full inline-block border border-slate-300" style={{ backgroundColor: item.selectedColor.hex }} />
                        {item.selectedColor.name}
                      </span>
                    </div>

                    {item.warrantySelected && (
                      <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Includes Shield Warranty (+$99)
                      </span>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-sm font-black text-blue-600">${itemPrice * item.quantity}</span>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden text-xs font-bold shadow-xs">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Promo Coupon Form */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            {appliedPromo ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-700">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Promo ({appliedPromo.code}): -${discountAmount}</span>
                </div>
                <button onClick={() => setAppliedPromo(null)} className="text-slate-500 hover:text-slate-900 underline text-[10px] font-bold">Remove</button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="space-y-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo Coupon (e.g. MXWELCOME50)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 uppercase placeholder:normal-case placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer">
                    Apply
                  </button>
                </div>
                {promoError && <p className="text-[10px] text-rose-600 font-bold">{promoError}</p>}
              </form>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Subtotal:</span>
                <span className="font-bold text-slate-900">${rawSubtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount Savings:</span>
                  <span>-${discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Express Shipping:</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-200 text-slate-900">
                <span>Estimated Total:</span>
                <span className="text-blue-600">${finalTotal}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                setCurrentView('checkout');
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              Proceed To Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
