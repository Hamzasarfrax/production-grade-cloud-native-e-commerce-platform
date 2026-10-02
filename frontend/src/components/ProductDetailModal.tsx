import React, { useState } from 'react';
import { 
  X, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  ShoppingBag, 
  Check, 
  Cpu, 
  Camera, 
  Battery, 
  Smartphone, 
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Share2
} from 'lucide-react';
import { PhoneProduct, ViewMode, ColorOption, CartItem } from '../types';

interface ProductDetailModalProps {
  product: PhoneProduct | null;
  onClose: () => void;
  addToCart: (product: PhoneProduct, storage: string, color: ColorOption, warranty: boolean) => void;
  setCurrentView: (view: ViewMode) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  addToCart,
  setCurrentView
}) => {
  if (!product) return null;

  const [selectedImage, setSelectedImage] = useState(product.images[0] || product.image);
  const [selectedStorage, setSelectedStorage] = useState(product.storageOptions[0] || '128GB');
  const [selectedColor, setSelectedColor] = useState<ColorOption>(product.colorOptions[0]);
  const [includeWarranty, setIncludeWarranty] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'shipping'>('specs');

  // Storage Price Adder Calculation
  const getStoragePriceBonus = (storage: string) => {
    if (storage === '256GB') return 100;
    if (storage === '512GB') return 250;
    if (storage === '1TB') return 450;
    return 0; // base (128GB or lowest)
  };

  const finalPrice = product.price + getStoragePriceBonus(selectedStorage) + (includeWarranty ? 99 : 0);

  const handleAddToCart = (directCheckout = false) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedStorage, selectedColor, includeWarranty);
    }
    if (directCheckout) {
      onClose();
      setCurrentView('checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="text-blue-600">{product.brand}</span> / <span>{product.model}</span>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{product.condition}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-8 text-slate-900">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Image Gallery Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-center h-80 relative">
                <img 
                  src={selectedImage} 
                  alt={product.name} 
                  className="max-h-72 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
                  {product.os} Flagship
                </span>
              </div>

              {/* Thumbnail strip */}
              {product.images && product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 rounded-xl bg-slate-50 p-1 border transition cursor-pointer shrink-0 ${
                        selectedImage === img ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Genuine Sealed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>24-Hour Dispatch</span>
                </div>
              </div>
            </div>

            {/* Right Product Selection Column (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-bold text-slate-700">{product.brand} Official</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{product.rating} ({product.reviewsCount} customer reviews)</span>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {product.name}
                </h2>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Storage Tier Options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Storage Capacity
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {product.storageOptions.map(st => {
                    const priceDiff = getStoragePriceBonus(st);
                    return (
                      <button
                        key={st}
                        onClick={() => setSelectedStorage(st)}
                        className={`p-2.5 rounded-xl text-center border font-bold transition cursor-pointer ${
                          selectedStorage === st 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-black">{st}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">
                          {priceDiff > 0 ? `+$${priceDiff}` : 'Standard'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Color Finish: <span className="text-blue-600 font-bold">{selectedColor.name}</span>
                </label>
                <div className="flex items-center gap-3">
                  {product.colorOptions.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition border-2 cursor-pointer ${
                        selectedColor.name === color.name ? 'border-blue-600 scale-110 shadow-md' : 'border-slate-300 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor.name === color.name && (
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extended Warranty Addon */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Add 1-Year Mxmobilz Shield Protection</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Covers accidental drops, liquid spills & VIP priority repair replacement</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeWarranty(!includeWarranty)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    includeWarranty 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {includeWarranty ? 'Included (+$99)' : '+ $99 Shield'}
                </button>
              </div>

              {/* Price & Primary CTA */}
              <div className="pt-3 border-t border-slate-200 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black text-slate-900">${finalPrice}</span>
                    <span className="text-xs text-slate-500 ml-2">Total calculated price</span>
                  </div>
                  <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Free Express Shipping
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAddToCart(false)}
                    className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add To Shopping Cart
                  </button>

                  <button
                    onClick={() => handleAddToCart(true)}
                    className="py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/25 cursor-pointer"
                  >
                    Buy Now • Direct Checkout
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Detailed Specs & Reviews Tabs */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-3 text-xs font-bold">
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'specs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Technical Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Verified Reviews ({product.reviewsList?.length || 0})
              </button>
            </div>

            <div className="py-4">
              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="text-slate-800 font-bold">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-3 text-xs">
                  {product.reviewsList && product.reviewsList.length > 0 ? (
                    product.reviewsList.map(rev => (
                      <div key={rev.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{rev.userName}</span>
                          <span className="text-slate-400">{rev.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                        <p className="text-slate-600 mt-1">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">No reviews yet. Be the first to review this flagship!</p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
