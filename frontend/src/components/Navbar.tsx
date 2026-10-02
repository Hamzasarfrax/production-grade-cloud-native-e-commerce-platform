import React, { useState } from 'react';
import { 
  Smartphone, 
  Search, 
  ShoppingBag, 
  RefreshCw, 
  Scale, 
  Headphones, 
  ShieldCheck, 
  Menu, 
  X, 
  BarChart3,
  Sparkles,
  ChevronRight,
  Apple
} from 'lucide-react';
import { ViewMode, CartItem, PhoneProduct, BrandType } from '../types';

interface NavbarProps {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  cartItems: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  products: PhoneProduct[];
  setSelectedProduct: (product: PhoneProduct | null) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  cartItems,
  setIsCartOpen,
  searchQuery,
  setSearchQuery,
  products,
  setSelectedProduct,
  setSelectedBrand
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Search autocomplete items
  const searchResults = searchQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.os.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleBrandSelect = (brand: BrandType | 'All') => {
    setSelectedBrand(brand);
    setCurrentView('shop');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-slate-800 border-b border-slate-200 shadow-xs">
      {/* Top Banner */}
      <div className="bg-slate-900 text-xs py-1.5 px-4 text-center text-white font-medium flex items-center justify-between">
        <div className="hidden md:flex items-center gap-4 text-slate-300 text-xs">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Genuine Mobile Guarantee
          </span>
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Free 30-Day Express Returns
          </span>
        </div>
        
        <div className="mx-auto md:mx-0 flex items-center gap-2">
          <span className="bg-orange-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white">OFFER</span>
          <span>Get up to <b className="text-orange-400">$800 Trade-In Credit</b> on iPhone 16 & Galaxy S25!</span>
          <button 
            onClick={() => setCurrentView('trade-in')}
            className="underline text-blue-400 hover:text-blue-300 ml-1 font-semibold cursor-pointer"
          >
            Calculate
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('contact')}
            className="hover:text-blue-300 flex items-center gap-1 transition cursor-pointer text-slate-300"
          >
            <Headphones className="w-3.5 h-3.5 text-orange-400" /> Support 24/7
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 p-0.5 shadow-md shadow-blue-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-orange-400 transform -rotate-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Mx<span className="text-blue-600">mobilz</span>
                </span>
                <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">iPhone & Android Flagship Store</p>
            </div>
          </div>

          {/* Search Bar with Live Autocomplete */}
          <div className="hidden md:block flex-1 max-w-md relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search iPhone 16 Pro, Galaxy S25, Pixel 9..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                  Matching Devices ({searchResults.length})
                </div>
                {searchResults.map(product => (
                  <div
                    key={product.id}
                    onMouseDown={() => {
                      setSelectedProduct(product);
                      setCurrentView('product-detail');
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer transition border-b border-slate-100 last:border-0"
                  >
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-10 h-10 object-cover rounded-lg bg-slate-100" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{product.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="text-blue-600 font-bold">${product.price}</span>
                        <span>•</span>
                        <span>{product.brand} ({product.os})</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => setCurrentView('landing')}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                currentView === 'landing' 
                  ? 'text-blue-600 bg-blue-50 font-bold border border-blue-100' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                setSelectedBrand('All');
                setCurrentView('shop');
              }}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                currentView === 'shop' 
                  ? 'text-blue-600 bg-blue-50 font-bold border border-blue-100' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Store Shop
            </button>

            <button
              onClick={() => setCurrentView('compare')}
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'compare' 
                  ? 'text-blue-600 bg-blue-50 font-bold border border-blue-100' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Scale className="w-4 h-4 text-indigo-500" />
              Compare Specs
            </button>

            <button
              onClick={() => setCurrentView('trade-in')}
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'trade-in' 
                  ? 'text-blue-600 bg-blue-50 font-bold border border-blue-100' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              Trade-In
            </button>

            <button
              onClick={() => setCurrentView('contact')}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                currentView === 'contact' 
                  ? 'text-blue-600 bg-blue-50 font-bold border border-blue-100' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Contact Us
            </button>

            <button
              onClick={() => setCurrentView('privacy')}
              className={`px-3 py-2 rounded-xl transition cursor-pointer ${
                currentView === 'privacy' 
                  ? 'text-blue-600 bg-blue-50 font-bold border border-blue-100' 
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Privacy
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Admin Dashboard Link */}
            <button
              onClick={() => setCurrentView('admin')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition cursor-pointer"
              title="Business Admin Dashboard"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>

            {/* Shopping Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-2 cursor-pointer"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartCount > 0 && (
                <span className="bg-slate-900 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>

        {/* Brand Bar Shortcuts */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/80 hidden sm:flex items-center justify-between text-xs text-slate-500 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Quick Brands:</span>
            <button 
              onClick={() => handleBrandSelect('Apple')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Apple className="w-3.5 h-3.5 text-slate-800" /> iPhone
            </button>
            <button 
              onClick={() => handleBrandSelect('Samsung')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer font-medium"
            >
              Samsung Galaxy
            </button>
            <button 
              onClick={() => handleBrandSelect('Google')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer font-medium"
            >
              Google Pixel
            </button>
            <button 
              onClick={() => handleBrandSelect('OnePlus')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer font-medium"
            >
              OnePlus
            </button>
            <button 
              onClick={() => handleBrandSelect('Nothing')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer font-medium"
            >
              Nothing Phone
            </button>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" /> 0% APR Financing Available
            </span>
          </div>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          {/* Mobile Search */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search mobiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-medium">
            <button
              onClick={() => { setCurrentView('landing'); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-left font-semibold hover:bg-slate-200"
            >
              Home Landing
            </button>
            <button
              onClick={() => { handleBrandSelect('All'); }}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-left font-semibold hover:bg-slate-200"
            >
              All Mobiles
            </button>
            <button
              onClick={() => { setCurrentView('compare'); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-left font-semibold flex items-center gap-1"
            >
              <Scale className="w-4 h-4" /> Compare Specs
            </button>
            <button
              onClick={() => { setCurrentView('trade-in'); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-left font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" /> Trade-In Value
            </button>
            <button
              onClick={() => { setCurrentView('contact'); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-left font-semibold hover:bg-slate-200"
            >
              Contact Us
            </button>
            <button
              onClick={() => { setCurrentView('privacy'); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-left font-semibold hover:bg-slate-200"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => { setCurrentView('admin'); setIsMobileMenuOpen(false); }}
              className="col-span-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-center font-bold flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-4 h-4" /> Open Admin Business Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
