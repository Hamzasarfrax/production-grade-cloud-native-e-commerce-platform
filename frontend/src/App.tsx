import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { ShopPage } from './components/ShopPage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ComparePage } from './components/ComparePage';
import { TradeInPage } from './components/TradeInPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ContactPage } from './components/ContactPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { AdminDashboard } from './components/AdminDashboard';

import { 
  PhoneProduct, 
  CartItem, 
  Order, 
  CustomerInquiry, 
  PromoCode, 
  ViewMode, 
  ColorOption 
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_INQUIRIES, 
  INITIAL_PROMOS 
} from './data/mockData';
import api from './api';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [apiMode, setApiMode] = useState(false);
  const [products, setProducts] = useState<PhoneProduct[]>(() => {
    const saved = localStorage.getItem('mxmobilz_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('mxmobilz_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('mxmobilz_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(() => {
    const saved = localStorage.getItem('mxmobilz_inquiries');
    return saved ? JSON.parse(saved) : INITIAL_INQUIRIES;
  });

  const [promos, setPromos] = useState<PromoCode[]>(INITIAL_PROMOS);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PhoneProduct | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('mxmobilz_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mxmobilz_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('mxmobilz_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mxmobilz_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);

  // Bootstrap: load live data from the Laravel API. Falls back to mock/localStorage.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [products, orders, inquiries, promos] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
          api.getInquiries(),
          api.getPromos(),
        ]);

        if (cancelled) return;

        setProducts(products);
        setOrders(orders);
        setInquiries(inquiries);
        setPromos(promos);
        setApiMode(true);
      } catch {
        // API unreachable — keep mock data + localStorage as fallback.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Cart operations
  const addToCart = (
    product: PhoneProduct, 
    storage: string, 
    color: ColorOption, 
    warrantySelected: boolean
  ) => {
    const existingIndex = cartItems.findIndex(
      item => item.product.id === product.id && 
              item.selectedStorage === storage && 
              item.selectedColor.name === color.name &&
              item.warrantySelected === warrantySelected
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        product,
        selectedStorage: storage,
        selectedColor: color,
        quantity: 1,
        warrantySelected,
        warrantyPrice: warrantySelected ? 99 : 0
      };
      setCartItems([...cartItems, newItem]);
    }

    setIsCartOpen(true);
  };

  const updateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCartItems(cartItems.map(item => item.id === cartItemId ? { ...item, quantity: newQty } : item));
    }
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedPromo(null);
  };

  const handleOrderPlaced = async (newOrder: Order) => {
    if (apiMode) {
      try {
        await api.createOrder(newOrder);
      } catch (err) {
        console.error('Failed to persist order to API', err);
      }
    }
    setOrders([newOrder, ...orders]);
    setLastPlacedOrder(newOrder);
  };

  const handleAddInquiry = async (newInquiry: CustomerInquiry) => {
    if (apiMode) {
      try {
        await api.createInquiry(newInquiry);
      } catch (err) {
        console.error('Failed to persist inquiry to API', err);
      }
    }
    setInquiries([newInquiry, ...inquiries]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        cartItems={cartItems}
        setIsCartOpen={setIsCartOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        products={products}
        setSelectedProduct={setSelectedProduct}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            products={products}
            setCurrentView={setCurrentView}
            setSelectedProduct={setSelectedProduct}
            setSelectedBrand={setSelectedBrand}
            addToCart={addToCart}
          />
        )}

        {currentView === 'shop' && (
          <ShopPage
            products={products}
            setCurrentView={setCurrentView}
            setSelectedProduct={setSelectedProduct}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            addToCart={addToCart}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {currentView === 'compare' && (
          <ComparePage
            products={products}
            setCurrentView={setCurrentView}
            addToCart={addToCart}
            setSelectedProduct={setSelectedProduct}
          />
        )}

        {currentView === 'trade-in' && (
          <TradeInPage
            setCurrentView={setCurrentView}
            setSelectedBrand={setSelectedBrand}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            cartItems={cartItems}
            setCurrentView={setCurrentView}
            appliedPromo={appliedPromo}
            clearCart={clearCart}
            onOrderPlaced={handleOrderPlaced}
          />
        )}

        {currentView === 'contact' && (
          <ContactPage
            onAddInquiry={handleAddInquiry}
          />
        )}

        {currentView === 'privacy' && (
          <PrivacyPolicyPage />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
            inquiries={inquiries}
            setInquiries={setInquiries}
            promos={promos}
            setPromos={setPromos}
            api={apiMode ? api : undefined}
            apiMode={apiMode}
          />
        )}
      </main>

      {/* Modals & Slide-Over Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        updateQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        setCurrentView={setCurrentView}
        appliedPromo={appliedPromo}
        setAppliedPromo={setAppliedPromo}
        availablePromos={promos}
      />

      {currentView === 'product-detail' && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setCurrentView('shop')}
          addToCart={addToCart}
          setCurrentView={setCurrentView}
        />
      )}

      {lastPlacedOrder && (
        <OrderSuccessModal
          order={lastPlacedOrder}
          onClose={() => setLastPlacedOrder(null)}
          setCurrentView={setCurrentView}
        />
      )}

      {/* Footer */}
      <Footer
        setCurrentView={setCurrentView}
        setSelectedBrand={setSelectedBrand}
      />

    </div>
  );
}
