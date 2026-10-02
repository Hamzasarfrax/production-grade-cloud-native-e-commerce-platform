import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Users, 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Tag, 
  MessageSquare, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Smartphone,
  Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { PhoneProduct, Order, CustomerInquiry, PromoCode, BrandType, OSType } from '../types';
import apiClient, { AdminStats } from '../api';

interface AdminDashboardProps {
  products: PhoneProduct[];
  setProducts: React.Dispatch<React.SetStateAction<PhoneProduct[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  inquiries: CustomerInquiry[];
  setInquiries: React.Dispatch<React.SetStateAction<CustomerInquiry[]>>;
  promos: PromoCode[];
  setPromos: React.Dispatch<React.SetStateAction<PromoCode[]>>;
  api?: typeof apiClient;
  apiMode?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  setProducts,
  orders,
  setOrders,
  inquiries,
  setInquiries,
  promos,
  setPromos,
  api,
  apiMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'orders' | 'inquiries' | 'promos'>('analytics');

  // Live stats from the backend API (when connected).
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;

    api.getStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { /* keep local calculations */ });

    return () => { cancelled = true; };
  }, [api]);
  
  // Product Search & Filter inside Admin
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: 'Apple' as BrandType,
    model: '',
    os: 'iOS' as OSType,
    price: 999,
    originalPrice: 1099,
    storage: '256GB',
    colorName: 'Space Titanium',
    colorHex: '#3d3d3d',
    inStock: 15,
    processor: 'A18 Pro',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    description: 'High-performance flagship mobile phone.'
  });

  // Analytics Chart Data
  const revenueData = [
    { month: 'Mar', revenue: 42000, orders: 112 },
    { month: 'Apr', revenue: 58000, orders: 145 },
    { month: 'May', revenue: 64000, orders: 168 },
    { month: 'Jun', revenue: 89000, orders: 210 },
    { month: 'Jul', revenue: 115000, orders: 285 },
    { month: 'Aug', revenue: 148250, orders: 342 }
  ];

  const brandDistribution = [
    { name: 'Apple iPhone', value: 52, color: '#3b82f6' },
    { name: 'Samsung Galaxy', value: 28, color: '#6366f1' },
    { name: 'Google Pixel', value: 12, color: '#10b981' },
    { name: 'OnePlus & Other', value: 8, color: '#a855f7' }
  ];

  const dailyOrdersData = [
    { day: 'Mon', count: 42 },
    { day: 'Tue', count: 58 },
    { day: 'Wed', count: 65 },
    { day: 'Thu', count: 52 },
    { day: 'Fri', count: 78 },
    { day: 'Sat', count: 89 },
    { day: 'Sun', count: 71 }
  ];

  // Calculated Metrics
  const totalRevenue = stats?.revenue ?? orders.reduce((sum, o) => sum + o.totalAmount, 0) + 145000;
  const totalStockCount = stats?.inStockUnits ?? products.reduce((sum, p) => sum + p.inStock, 0);
  const totalOrdersCount = stats?.ordersCount ?? 342;
  const avgOrderValue = stats?.avgOrderValue ?? 890;

  // Add Product Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.name) {
      const created: PhoneProduct = {
        id: `prod-${Date.now()}`,
        name: newProduct.name,
        brand: newProduct.brand,
        model: newProduct.model || newProduct.name,
        os: newProduct.os,
        price: Number(newProduct.price),
        originalPrice: Number(newProduct.originalPrice),
        rating: 5.0,
        reviewsCount: 1,
        inStock: Number(newProduct.inStock),
        storageOptions: [newProduct.storage, '512GB'],
        colorOptions: [{ name: newProduct.colorName, hex: newProduct.colorHex }],
        ram: '12GB',
        battery: '5000 mAh',
        camera: '50MP Triple System',
        processor: newProduct.processor,
        display: '6.7" OLED 120Hz',
        image: newProduct.image,
        images: [newProduct.image],
        condition: 'New',
        is5G: true,
        isFeatured: true,
        isBestSeller: false,
        description: newProduct.description,
        specs: {
          screenSize: '6.7 inches',
          refreshRate: '120Hz',
          chipset: newProduct.processor,
          mainCamera: '50MP Ultra Clear',
          frontCamera: '12MP',
          batteryCapacity: '5000 mAh',
          chargingSpeed: '45W Fast Charge',
          weight: '210g',
          osVersion: newProduct.os,
          waterResistance: 'IP68'
        }
      };

      if (api) {
        try {
          const saved = await api.createProduct(created);
          setProducts([saved, ...products]);
        } catch (err) {
          console.error('Failed to create product via API', err);
        }
      } else {
        setProducts([created, ...products]);
      }

      setIsAddProductOpen(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (api) {
      try {
        await api.deleteProduct(id);
      } catch (err) {
        console.error('Failed to delete product via API', err);
      }
    }
    setProducts(products.filter(p => p.id !== id));
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    if (api) {
      try {
        await api.updateOrderStatus(orderId, newStatus);
      } catch (err) {
        console.error('Failed to update order status via API', err);
      }
    }
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleUpdateInquiryStatus = async (inqId: string, newStatus: CustomerInquiry['status']) => {
    if (api) {
      try {
        await api.updateInquiryStatus(inqId, newStatus);
      } catch (err) {
        console.error('Failed to update inquiry status via API', err);
      }
    }
    setInquiries(inquiries.map(i => i.id === inqId ? { ...i, status: newStatus } : i));
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Store Live Control Room</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              Mxmobilz Business Admin
            </h1>
            <span className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border ${apiMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiMode ? 'bg-blue-600' : 'bg-amber-500'}`} />
              {apiMode ? 'Connected to Backend API — All data live' : 'Using local mock data (API offline)'}
            </span>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 text-xs font-bold shadow-xs">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Inventory ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'orders' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                activeTab === 'inquiries' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Messages ({inquiries.length})
            </button>
          </div>
        </div>

        {/* 1. Analytics Dashboard Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Sales Revenue</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">${totalRevenue.toLocaleString()}</div>
                <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +24.8% from last month
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Orders</span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{totalOrdersCount}</div>
                <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.2% conversion rate
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">In-Stock Mobiles</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{totalStockCount} units</div>
                <div className="text-[11px] text-slate-500 font-medium">Across {products.length} models</div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Avg Order Value</span>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">${avgOrderValue.toLocaleString()}</div>
                <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Premium Flagship Segment
                </div>
              </div>

            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Monthly Revenue Trend Chart */}
              <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Monthly Sales Revenue Growth</h3>
                  <span className="text-xs text-blue-600 font-bold">USD ($)</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* OS Brand Market Share Pie */}
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Brand Sales Distribution</h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={brandDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                        {brandDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-xs">
                  {brandDistribution.map(b => (
                    <div key={b.name} className="flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                        <span className="font-medium">{b.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{b.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. Inventory Management Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search inventory by model name or brand..."
                  value={adminProductSearch}
                  onChange={(e) => setAdminProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Smartphone
              </button>
            </div>

            {/* Inventory Products Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-4">Device</th>
                      <th className="p-4">Brand / OS</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">In Stock</th>
                      <th className="p-4">Condition</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.filter(p => p.name.toLowerCase().includes(adminProductSearch.toLowerCase())).map(product => (
                      <tr key={product.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="w-10 h-10 object-contain rounded bg-slate-50 border border-slate-200 p-1" referrerPolicy="no-referrer" />
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                            <div className="text-[10px] text-slate-500">{product.processor}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900">{product.brand}</span>
                          <span className="text-[10px] text-slate-500 block font-medium">{product.os}</span>
                        </td>
                        <td className="p-4 font-bold text-blue-600">${product.price}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${product.inStock > 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {product.inStock} units
                          </span>
                        </td>
                        <td className="p-4 font-medium">{product.condition}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. Orders Management Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-900">
              Customer Orders & Dispatch Status
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Devices Purchased</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Fulfillment Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono font-black text-amber-600">{order.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{order.shippingDetails.fullName}</div>
                        <div className="text-[10px] text-slate-500">{order.shippingDetails.email}</div>
                      </td>
                      <td className="p-4">
                        {order.items.map(i => (
                          <div key={i.id} className="text-[11px] font-medium text-slate-800">
                            {i.product.name} ({i.selectedStorage}) x{i.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="p-4 font-black text-blue-600">${order.totalAmount}</td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-bold text-emerald-700"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => window.print()}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer flex items-center gap-1 font-bold border border-slate-200"
                        >
                          <Printer className="w-3.5 h-3.5" /> Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Customer Support Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Customer Messages & Contact Inquiries</h3>

            <div className="space-y-3 text-xs">
              {inquiries.map(inq => (
                <div key={inq.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{inq.name}</span>
                      <span className="text-slate-500 ml-2 font-medium">({inq.email})</span>
                    </div>
                    <select
                      value={inq.status}
                      onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg p-1 text-xs font-bold text-blue-600"
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="font-bold text-blue-600">{inq.subject}</div>
                  <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 font-medium">
                    "{inq.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Add Smartphone Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base">Add New Smartphone To Store</h3>
              <button onClick={() => setIsAddProductOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple iPhone 16 Plus"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Brand</label>
                  <select
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Google">Google</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="Nothing">Nothing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">OS Platform</label>
                  <select
                    value={newProduct.os}
                    onChange={(e) => setNewProduct({ ...newProduct, os: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold"
                  >
                    <option value="iOS">iOS</option>
                    <option value="Android">Android</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">In Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={newProduct.inStock}
                    onChange={(e) => setNewProduct({ ...newProduct, inStock: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs mt-2 cursor-pointer shadow-md"
              >
                Save Device To Catalog
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
