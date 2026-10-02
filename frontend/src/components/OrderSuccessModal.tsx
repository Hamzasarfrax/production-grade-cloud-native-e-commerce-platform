import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Package, Printer, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { Order, ViewMode } from '../types';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  setCurrentView: (view: ViewMode) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  setCurrentView
}) => {
  useEffect(() => {
    if (order) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8 my-auto">
        
        {/* Success Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Order Confirmed!</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Thank you for shopping at <b>Mxmobilz</b>. Your order <b>#{order.id}</b> is now processing for 24-hour express dispatch.
          </p>
        </div>

        {/* Tracking & Details Box */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Express Tracking Number</span>
              <span className="font-mono font-black text-amber-600 text-sm">{order.trackingNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Payment Status</span>
              <span className="text-emerald-700 font-black">Paid via {order.paymentMethod}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800">Ordered Mobile Devices ({order.items.length}):</h4>
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between text-slate-700 font-medium">
                <span>{item.product.name} ({item.selectedStorage}, {item.selectedColor.name}) x{item.quantity}</span>
                <span className="font-bold text-blue-600">${item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
            <span>Total Paid Amount:</span>
            <span className="text-emerald-700">${order.totalAmount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-slate-200"
          >
            <Printer className="w-4 h-4 text-slate-600" /> Print Invoice Slip
          </button>

          <button
            onClick={() => {
              onClose();
              setCurrentView('shop');
            }}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
          >
            Continue Shopping Catalog <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
