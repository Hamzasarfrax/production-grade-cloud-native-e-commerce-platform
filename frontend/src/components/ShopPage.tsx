import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Search, 
  SlidersHorizontal, 
  Star, 
  ShoppingBag, 
  Eye, 
  Cpu, 
  Camera, 
  Check, 
  RotateCcw,
  Sparkles,
  Grid,
  List,
  Scale,
  X
} from 'lucide-react';
import { PhoneProduct, ViewMode, ColorOption, BrandType, OSType, ConditionType } from '../types';

interface ShopPageProps {
  products: PhoneProduct[];
  setCurrentView: (view: ViewMode) => void;
  setSelectedProduct: (product: PhoneProduct | null) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  addToCart: (product: PhoneProduct, storage: string, color: ColorOption, warranty: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  setCurrentView,
  setSelectedProduct,
  selectedBrand,
  setSelectedBrand,
  addToCart,
  searchQuery,
  setSearchQuery
}) => {
  const [selectedOS, setSelectedOS] = useState<'All' | OSType>('All');
  const [selectedCondition, setSelectedCondition] = useState<'All' | ConditionType>('All');
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [only5G, setOnly5G] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Brand filter
      if (selectedBrand !== 'All' && product.brand !== selectedBrand) return false;
      // OS filter
      if (selectedOS !== 'All' && product.os !== selectedOS) return false;
      // Condition filter
      if (selectedCondition !== 'All' && product.condition !== selectedCondition) return false;
      // Max price
      if (product.price > maxPrice) return false;
      // 5G
      if (only5G && !product.is5G) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesModel = product.model.toLowerCase().includes(query);
        const matchesProcessor = product.processor.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesModel && !matchesProcessor) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, selectedBrand, selectedOS, selectedCondition, maxPrice, only5G, searchQuery, sortBy]);

  const resetFilters = () => {
    setSelectedBrand('All');
    setSelectedOS('All');
    setSelectedCondition('All');
    setMaxPrice(2000);
    setOnly5G(false);
    setSearchQuery('');
    setSortBy('featured');
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb & Title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">
              <span>Home</span> / <span className="text-slate-900">Mobile Phone Store Catalog</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Flagship iPhones & Android Devices
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                {filteredProducts.length} Items
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600 shadow-xs"
            >
              <option value="featured">Sort by: Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
            </select>

            {/* Layout Toggle */}
            <div className="hidden sm:flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition ${viewLayout === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}
                aria-label="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-lg transition ${viewLayout === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}
                aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-xs"
            >
              <Filter className="w-4 h-4 text-blue-600" /> Filters
            </button>
          </div>
        </div>

        {/* Main Grid: Sidebar Filters + Catalog Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Desktop Sidebar Filter (3 Cols) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filter Mobiles</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
              >
                Reset All
              </button>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by name/processor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Brand Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Brand Manufacturer
              </h4>
              <div className="space-y-1 text-xs">
                {['All', 'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Nothing'].map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`w-full text-left px-3 py-2 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${
                      selectedBrand === brand 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs' 
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{brand === 'All' ? 'All Brands' : brand}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {brand === 'All' ? products.length : products.filter(p => p.brand === brand).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* OS Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Operating System
              </h4>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                {['All', 'iOS', 'Android'].map(os => (
                  <button
                    key={os}
                    onClick={() => setSelectedOS(os as any)}
                    className={`py-1.5 px-2 rounded-xl text-center border transition cursor-pointer ${
                      selectedOS === os 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {os}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Device Condition
              </h4>
              <div className="space-y-1 text-xs font-medium">
                {['All', 'New', 'Certified Refurbished'].map(cond => (
                  <label key={cond} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                    <input
                      type="radio"
                      name="condition"
                      checked={selectedCondition === cond}
                      onChange={() => setSelectedCondition(cond as any)}
                      className="accent-blue-600"
                    />
                    <span className="text-slate-700 font-bold">{cond === 'All' ? 'All Conditions' : cond}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span>Max Price:</span>
                <span className="text-blue-600 font-black">${maxPrice}</span>
              </div>
              <input
                type="range"
                min="300"
                max="2000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>$300</span>
                <span>$2,000</span>
              </div>
            </div>

            {/* 5G Switch */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">5G Capable Devices Only</span>
              <input
                type="checkbox"
                checked={only5G}
                onChange={(e) => setOnly5G(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

          </aside>

          {/* Product Grid Area (9 Cols) */}
          <main className="lg:col-span-9">
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Mobile Devices Match Your Filters</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try clearing search parameters, increasing max price, or selecting "All Brands" to view our complete inventory.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-md"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className={
                viewLayout === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
              }>
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition duration-300 overflow-hidden flex ${
                      viewLayout === 'grid' ? 'flex-col' : 'flex-col sm:flex-row items-center p-4 gap-6'
                    } group shadow-sm hover:shadow-xl`}
                  >
                    {/* Thumbnail Image */}
                    <div className={`relative bg-slate-50 border-b border-slate-100 flex items-center justify-center ${
                      viewLayout === 'grid' ? 'h-60 p-6' : 'w-full sm:w-48 h-48 rounded-xl p-4 shrink-0 border-none'
                    }`}>
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-44 object-contain group-hover:scale-105 transition duration-500"
                        referrerPolicy="no-referrer"
                      />

                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${
                          product.os === 'iOS' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {product.os}
                        </span>
                      </div>

                      {product.originalPrice > product.price && (
                        <div className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          Save ${product.originalPrice - product.price}
                        </div>
                      )}
                    </div>

                    {/* Details Container */}
                    <div className={`p-5 flex-1 flex flex-col justify-between ${viewLayout === 'list' ? 'p-0' : ''}`}>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-bold text-slate-700">{product.brand}</span>
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{product.rating}</span>
                          </div>
                        </div>

                        <h3 
                          onClick={() => {
                            setSelectedProduct(product);
                            setCurrentView('product-detail');
                          }}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer line-clamp-1"
                        >
                          {product.name}
                        </h3>

                        {/* Storage Pills */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {product.storageOptions.map(st => (
                            <span key={st} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                              {st}
                            </span>
                          ))}
                        </div>

                        {/* Specs summary */}
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {product.processor} • {product.display}
                        </p>
                      </div>

                      {/* Price and Cart Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-lg font-black text-slate-900">${product.price}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{product.inStock} units in stock</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setCurrentView('product-detail');
                            }}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="View Specs & Photos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              addToCart(product, product.storageOptions[0], product.colorOptions[0], false);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" /> Buy Now
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}

          </main>

        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Filter Mobile Phone Inventory</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Brands</h4>
              <div className="space-y-1 text-xs">
                {['All', 'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Nothing'].map(brand => (
                  <button
                    key={brand}
                    onClick={() => { setSelectedBrand(brand); setIsMobileFilterOpen(false); }}
                    className={`w-full text-left p-2 rounded-xl font-bold ${selectedBrand === brand ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md"
            >
              Apply Filters ({filteredProducts.length} Items)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
