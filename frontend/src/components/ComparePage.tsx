import React, { useState } from 'react';
import { 
  Scale, 
  Smartphone, 
  Check, 
  X, 
  Plus, 
  ShoppingBag, 
  Star, 
  Cpu, 
  Camera, 
  Battery, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { PhoneProduct, ViewMode, ColorOption } from '../types';

interface ComparePageProps {
  products: PhoneProduct[];
  setCurrentView: (view: ViewMode) => void;
  addToCart: (product: PhoneProduct, storage: string, color: ColorOption, warranty: boolean) => void;
  setSelectedProduct: (product: PhoneProduct | null) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  products,
  setCurrentView,
  addToCart,
  setSelectedProduct
}) => {
  // Default selected 2 or 3 flagships
  const [selectedIds, setSelectedIds] = useState<string[]>([
    products[0]?.id || '',
    products[1]?.id || '',
    products[3]?.id || ''
  ]);

  const selectedProducts = selectedIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is PhoneProduct => Boolean(p));

  const handleSelectProduct = (index: number, id: string) => {
    const updated = [...selectedIds];
    updated[index] = id;
    setSelectedIds(updated);
  };

  const removeSlot = (index: number) => {
    const updated = selectedIds.filter((_, i) => i !== index);
    setSelectedIds(updated);
  };

  const addSlot = () => {
    if (selectedIds.length < 4) {
      const unused = products.find(p => !selectedIds.includes(p.id));
      if (unused) {
        setSelectedIds([...selectedIds, unused.id]);
      }
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" /> Side-By-Side Spec Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Compare Flagship Smartphones
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Compare chipsets, display refresh rates, camera optics, battery longevity, and price to pick the right phone for your lifestyle.
          </p>
        </div>

        {/* Device Selectors Header Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {selectedIds.map((id, index) => {
            const product = products.find(p => p.id === id);
            return (
              <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 relative shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Device Slot #{index + 1}</span>
                  {selectedIds.length > 2 && (
                    <button onClick={() => removeSlot(index)} className="text-rose-500 hover:text-rose-700">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <select
                  value={id}
                  onChange={(e) => handleSelectProduct(index, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.price})
                    </option>
                  ))}
                </select>

                {product && (
                  <div className="text-center pt-2">
                    <img src={product.image} alt={product.name} className="h-36 object-contain mx-auto my-2" referrerPolicy="no-referrer" />
                    <h3 className="font-bold text-slate-900 text-sm truncate">{product.name}</h3>
                    <div className="text-lg font-black text-blue-600 mt-1">${product.price}</div>
                    
                    <button
                      onClick={() => addToCart(product, product.storageOptions[0], product.colorOptions[0], false)}
                      className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Buy This Device
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {selectedIds.length < 4 && (
            <button
              onClick={addSlot}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white/50 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 transition cursor-pointer"
            >
              <Plus className="w-8 h-8 mb-2 text-blue-600" />
              <span className="text-xs font-bold">Add Another Device To Compare</span>
            </button>
          )}
        </div>

        {/* Detailed Spec Matrix Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-900">
            Technical Specification Breakdown Matrix
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            
            {/* Brand / OS */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4 hover:bg-slate-50 transition">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-0">OS Platform</div>
              {selectedProducts.map(p => (
                <div key={p.id} className="font-bold text-slate-900">
                  {p.brand} ({p.os})
                </div>
              ))}
            </div>

            {/* Processor / Chipset */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4 hover:bg-slate-50 transition">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-0">Processor & AI</div>
              {selectedProducts.map(p => (
                <div key={p.id} className="font-bold text-blue-600">
                  {p.processor}
                </div>
              ))}
            </div>

            {/* Display */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4 hover:bg-slate-50 transition">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-0">Display Specs</div>
              {selectedProducts.map(p => (
                <div key={p.id} className="font-bold text-slate-800">
                  {p.display}
                </div>
              ))}
            </div>

            {/* Camera */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4 hover:bg-slate-50 transition">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-0">Main Optics</div>
              {selectedProducts.map(p => (
                <div key={p.id} className="font-medium text-slate-700">
                  {p.specs.mainCamera}
                </div>
              ))}
            </div>

            {/* Battery & Charging */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4 hover:bg-slate-50 transition">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-0">Battery & Charge</div>
              {selectedProducts.map(p => (
                <div key={p.id} className="font-bold text-emerald-600">
                  {p.specs.batteryCapacity} ({p.specs.chargingSpeed})
                </div>
              ))}
            </div>

            {/* Water Resistance */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4 hover:bg-slate-50 transition">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-0">Water Resistance</div>
              {selectedProducts.map(p => (
                <div key={p.id} className="font-medium text-slate-700">
                  {p.specs.waterResistance}
                </div>
              ))}
            </div>

            {/* Weight */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4 hover:bg-slate-50 transition">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-0">Device Weight</div>
              {selectedProducts.map(p => (
                <div key={p.id} className="font-medium text-slate-700">
                  {p.specs.weight}
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
