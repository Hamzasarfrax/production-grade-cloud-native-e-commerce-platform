import React, { useState } from 'react';
import { 
  Smartphone, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Truck, 
  Star, 
  Scale, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  Camera, 
  Battery, 
  Apple,
  ShoppingBag,
  Eye,
  Percent
} from 'lucide-react';
import { PhoneProduct, ViewMode, ColorOption } from '../types';
import { heroBannerImg } from '../data/mockData';

interface LandingPageProps {
  products: PhoneProduct[];
  setCurrentView: (view: ViewMode) => void;
  setSelectedProduct: (product: PhoneProduct | null) => void;
  setSelectedBrand: (brand: string) => void;
  addToCart: (product: PhoneProduct, storage: string, color: ColorOption, warranty: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  products,
  setCurrentView,
  setSelectedProduct,
  setSelectedBrand,
  addToCart
}) => {
  const featuredProducts = products.filter(p => p.isFeatured);
  const bestSellers = products.filter(p => p.isBestSeller);

  // Robust product picks for the head-to-head compare section (no hardcoded index crashes).
  const compareCards = {
    iphone: products.find(p => p.brand === 'Apple' && p.model.includes('16 Pro Max')) ?? products[0],
    galaxy: products.find(p => p.brand === 'Samsung' && p.model.includes('S25 Ultra')) ?? products[1] ?? products[0],
    pixel: products.find(p => p.brand === 'Google') ?? products[2] ?? products[0],
  };

  // Quick Trade In Estimator State
  const [tradeBrand, setTradeBrand] = useState('Apple');
  const [tradeModel, setTradeModel] = useState('iPhone 14 Pro Max 256GB');
  const [tradeCondition, setTradeCondition] = useState('Flawless');

  const calculateQuickEstimate = () => {
    let base = 350;
    if (tradeModel.includes('15')) base = 520;
    if (tradeModel.includes('14')) base = 410;
    if (tradeModel.includes('13')) base = 310;
    if (tradeModel.includes('S24')) base = 540;
    if (tradeModel.includes('S23')) base = 380;
    if (tradeCondition === 'Flawless') base += 50;
    if (tradeCondition === 'Good') base += 20;
    return base;
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 border-b border-slate-200/80 bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-50">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold shadow-xs">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Next-Generation Flagship Mobile Collection 2026 TESTING GIT GITOPS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Upgrade to <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 bg-clip-text text-transparent">
                  Titanium Performance
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Discover the latest <b>iPhone 16 Pro Max</b> with Camera Control and <b>Samsung Galaxy S25 Ultra</b> with 200MP Galaxy AI. Certified 100% genuine with 1-Year Warranty and 24-Hour Express Dispatch.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => { setSelectedBrand('All'); setCurrentView('shop'); }}
                  className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Explore All Mobiles
                </button>

                <button
                  onClick={() => setCurrentView('trade-in')}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-sm shadow-sm flex items-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                  Calculate Trade-In Credit
                </button>
              </div>

              {/* Trust Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 text-xs">
                <div>
                  <div className="text-xl font-black text-slate-900">100%</div>
                  <div className="text-slate-500 font-medium mt-0.5">Original Factory Sealed</div>
                </div>
                <div>
                  <div className="text-xl font-black text-emerald-600">$800 Max</div>
                  <div className="text-slate-500 font-medium mt-0.5">Instant Trade-In Value</div>
                </div>
                <div>
                  <div className="text-xl font-black text-blue-600">4.9 ★★★★★</div>
                  <div className="text-slate-500 font-medium mt-0.5">Over 1,200+ Reviews</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-xl rounded-3xl p-3 bg-white border border-slate-200 shadow-2xl overflow-hidden group">
                <img
                  src={heroBannerImg}
                  alt="Mxmobilz iPhone and Android Flagships Showcase"
                  className="w-full h-[320px] sm:h-[400px] object-cover rounded-2xl transition duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay Badge */}
                <div className="absolute top-6 left-6 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>In Stock • Ready for Same-Day Dispatch</span>
                </div>

                <div className="absolute bottom-6 right-6 bg-white/95 text-slate-900 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 text-xs space-y-1 shadow-xl">
                  <div className="font-black text-orange-600 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" /> Save Up To $200 Today
                  </div>
                  <div className="text-slate-600 font-medium">Free 1-Year Mxmobilz Shield Included</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. OS & Brand Hub Category Cards */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shop By Mobile OS & Brand</h2>
              <p className="text-sm text-slate-500 mt-1">Select your preferred ecosystem to browse top flagship models</p>
            </div>
            <button
              onClick={() => { setSelectedBrand('All'); setCurrentView('shop'); }}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              View Entire Mobile Store Catalog <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Apple iPhone */}
            <div 
              onClick={() => { setSelectedBrand('Apple'); setCurrentView('shop'); }}
              className="group p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-500 hover:bg-white transition cursor-pointer shadow-xs hover:shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4 group-hover:bg-blue-600 transition shadow-md">
                <Apple className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition">Apple iPhone</h3>
              <p className="text-xs text-slate-500 mt-1">iOS 18 • A18 Pro Chip • Titanium Frame</p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>Explore iPhones</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Samsung Galaxy */}
            <div 
              onClick={() => { setSelectedBrand('Samsung'); setCurrentView('shop'); }}
              className="group p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-500 hover:bg-white transition cursor-pointer shadow-xs hover:shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition shadow-md">
                <Smartphone className="w-6 h-6 text-indigo-400 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition">Samsung Galaxy</h3>
              <p className="text-xs text-slate-500 mt-1">One UI 7 • Galaxy AI • 200MP Camera</p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Explore Galaxy</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Google Pixel */}
            <div 
              onClick={() => { setSelectedBrand('Google'); setCurrentView('shop'); }}
              className="group p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-500 hover:bg-white transition cursor-pointer shadow-xs hover:shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition shadow-md">
                <Zap className="w-6 h-6 text-emerald-400 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition">Google Pixel</h3>
              <p className="text-xs text-slate-500 mt-1">Pure Android 15 • Gemini AI • Actua OLED</p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Explore Pixel</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* OnePlus & Android High-End */}
            <div 
              onClick={() => { setSelectedBrand('OnePlus'); setCurrentView('shop'); }}
              className="group p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-500 hover:bg-white transition cursor-pointer shadow-xs hover:shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4 group-hover:bg-orange-500 transition shadow-md">
                <Cpu className="w-6 h-6 text-orange-400 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition">OnePlus & Others</h3>
              <p className="text-xs text-slate-500 mt-1">100W SUPERVOOC • Hasselblad Camera</p>
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-orange-600">
                <span>Explore OnePlus</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Featured Flagship Devices Showcase */}
      <section className="py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Featured Flagships
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Top Selling Mobile Devices
            </h2>
            <p className="text-slate-600 text-sm">
              Handpicked premium mobile phones with highest customer satisfaction ratings and full manufacturer warranty.
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product: { id: any; image: any; name: any; isBestSeller: any; os: string; condition: any; brand: any; rating: any; reviewsCount: any; description: any; processor: any; specs: { mainCamera: any; }; price: number; originalPrice: number; storageOptions: any[]; colorOptions: any[]; }) => (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 transition duration-300 overflow-hidden flex flex-col group shadow-sm hover:shadow-xl"
              >
                {/* Image & Badges Container */}
                <div className="relative bg-slate-50 p-6 flex items-center justify-center h-64 overflow-hidden border-b border-slate-100">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="h-52 object-contain group-hover:scale-110 transition duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.isBestSeller && (
                      <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
                        BEST SELLER
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      product.os === 'iOS' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {product.os}
                    </span>
                  </div>

                  {/* Condition Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 shadow-xs">
                    {product.condition}
                  </div>

                  {/* Quick Action overlay */}
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setCurrentView('product-detail');
                    }}
                    className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-xs font-bold text-white bg-slate-900/60 backdrop-blur-xs"
                  >
                    <Eye className="w-4 h-4" /> Quick View Details
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-bold text-slate-700">{product.brand}</span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{product.rating} ({product.reviewsCount})</span>
                      </div>
                    </div>

                    <h3 
                      onClick={() => {
                        setSelectedProduct(product);
                        setCurrentView('product-detail');
                      }}
                      className="text-lg font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer line-clamp-1"
                    >
                      {product.name}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Tech Specs Badges */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-1.5 truncate">
                      <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate font-medium">{product.processor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Camera className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate font-medium">{product.specs.mainCamera}</span>
                    </div>
                  </div>

                  {/* Price & Cart Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-900">${product.price}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-slate-400 line-through">${product.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold">Free Express Delivery</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          addToCart(product, product.storageOptions[0], product.colorOptions[0], false);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. Interactive Quick Trade-In Calculator Widget */}
      <section className="py-16 bg-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
            
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-extrabold uppercase">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" /> Trade-In Estimator
              </div>
              <h2 className="text-3xl font-black text-slate-900">
                Turn Your Old Phone Into <span className="text-emerald-600">Instant Cash Credit</span>
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Trade in your old iPhone or Android device and receive up to $800 towards any new device. Free prepaid shipping kit provided!
              </p>

              <div className="space-y-2 text-xs text-slate-700 font-medium pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Guaranteed quote locked for 14 days
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free data wipe & factory reset instructions
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant credit applied directly at checkout
                </div>
              </div>
            </div>

            {/* Estimator Interactive Box */}
            <div className="lg:col-span-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center justify-between">
                <span>Estimate Trade-In Value</span>
                <span className="text-xs text-blue-600 font-bold">Step 1 of 2</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Brand</label>
                  <select 
                    value={tradeBrand} 
                    onChange={(e) => setTradeBrand(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  >
                    <option value="Apple">Apple iPhone</option>
                    <option value="Samsung">Samsung Galaxy</option>
                    <option value="Google">Google Pixel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Model & Storage</label>
                  <select 
                    value={tradeModel} 
                    onChange={(e) => setTradeModel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium"
                  >
                    <option value="iPhone 15 Pro Max 256GB">iPhone 15 Pro Max 256GB</option>
                    <option value="iPhone 14 Pro Max 256GB">iPhone 14 Pro Max 256GB</option>
                    <option value="iPhone 13 Pro 128GB">iPhone 13 Pro 128GB</option>
                    <option value="Samsung Galaxy S24 Ultra">Samsung Galaxy S24 Ultra</option>
                    <option value="Samsung Galaxy S23 Ultra">Samsung Galaxy S23 Ultra</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Device Condition</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Flawless', 'Good', 'Fair'].map(cond => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setTradeCondition(cond)}
                        className={`p-2 text-center rounded-xl border font-bold transition cursor-pointer ${
                          tradeCondition === cond 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estimate Calculation Result */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-600 font-semibold block">Estimated Trade-In Credit</span>
                  <span className="text-2xl font-black text-emerald-700">${calculateQuickEstimate()}</span>
                </div>
                <button
                  onClick={() => setCurrentView('trade-in')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Claim This Quote
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 5. Mobile Device Comparison Tool Preview */}
      <section className="py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200 mb-2">
                <Scale className="w-3.5 h-3.5 text-indigo-600" /> Head-to-Head Comparison
              </div>
              <h2 className="text-3xl font-black text-slate-900">Compare iOS vs Android Flagships</h2>
            </div>
            <button
              onClick={() => setCurrentView('compare')}
              className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-indigo-700 font-bold text-xs hover:bg-slate-100 transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              Open Full Compare Matrix <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* iPhone 16 Pro Max card */}
            {compareCards.iphone && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <img src={compareCards.iphone.image} alt={compareCards.iphone.name} className="w-16 h-16 object-cover rounded-xl bg-slate-50" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{compareCards.iphone.name}</h3>
                  <span className="text-xs text-blue-600 font-bold">${compareCards.iphone.price}</span>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex justify-between">
                  <span className="text-slate-500">Chipset:</span>
                  <span className="font-bold text-slate-900">A18 Pro (3nm)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Display:</span>
                  <span className="font-bold text-slate-900">6.9" 120Hz OLED</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Main Camera:</span>
                  <span className="font-bold text-slate-900">48MP Fusion</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Battery:</span>
                  <span className="font-bold text-slate-900">4685 mAh (33h video)</span>
                </li>
              </ul>
            </div>
            )}

            {/* Galaxy S25 Ultra card */}
            {compareCards.galaxy && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <img src={compareCards.galaxy.image} alt={compareCards.galaxy.name} className="w-16 h-16 object-cover rounded-xl bg-slate-50" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{compareCards.galaxy.name}</h3>
                  <span className="text-xs text-indigo-600 font-bold">${compareCards.galaxy.price}</span>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex justify-between">
                  <span className="text-slate-500">Chipset:</span>
                  <span className="font-bold text-slate-900">Snapdragon 8 Elite</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Display:</span>
                  <span className="font-bold text-slate-900">6.8" 120Hz Anti-Glare</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Main Camera:</span>
                  <span className="font-bold text-slate-900">200MP Quad Tele</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Battery:</span>
                  <span className="font-bold text-slate-900">5000 mAh (45W Fast)</span>
                </li>
              </ul>
            </div>
            )}

            {/* Google Pixel 9 Pro XL */}
            {compareCards.pixel && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <img src={compareCards.pixel.image} alt={compareCards.pixel.name} className="w-16 h-16 object-cover rounded-xl bg-slate-50" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{compareCards.pixel.name}</h3>
                  <span className="text-xs text-emerald-600 font-bold">${compareCards.pixel.price}</span>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex justify-between">
                  <span className="text-slate-500">Chipset:</span>
                  <span className="font-bold text-slate-900">Google Tensor G4</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Display:</span>
                  <span className="font-bold text-slate-900">6.8" Super Actua</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Main Camera:</span>
                  <span className="font-bold text-slate-900">50MP Octa PD</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Battery:</span>
                  <span className="font-bold text-slate-900">5060 mAh</span>
                </li>
              </ul>
            </div>
            )}

          </div>
        </div>
      </section>

    </div>
  );
};
