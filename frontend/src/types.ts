export type BrandType = 'Apple' | 'Samsung' | 'Google' | 'OnePlus' | 'Xiaomi' | 'Nothing';

export type OSType = 'iOS' | 'Android';

export type ConditionType = 'New' | 'Certified Refurbished';

export interface ColorOption {
  name: string;
  hex: string;
  bgClass?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
}

export interface PhoneProduct {
  id: string;
  name: string;
  brand: BrandType;
  model: string;
  os: OSType;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  inStock: number;
  storageOptions: string[];
  colorOptions: ColorOption[];
  ram: string;
  battery: string;
  camera: string;
  processor: string;
  display: string;
  image: string;
  images: string[];
  condition: ConditionType;
  is5G: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  description: string;
  specs: {
    screenSize: string;
    refreshRate: string;
    chipset: string;
    mainCamera: string;
    frontCamera: string;
    batteryCapacity: string;
    chargingSpeed: string;
    weight: string;
    osVersion: string;
    waterResistance: string;
  };
  reviewsList?: Review[];
}

export interface CartItem {
  id: string; // unique cart line item ID
  product: PhoneProduct;
  selectedStorage: string;
  selectedColor: ColorOption;
  quantity: number;
  warrantySelected: boolean;
  warrantyPrice: number;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  date: string;
  shippingDetails: ShippingDetails;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: 'Credit/Debit Card' | 'Apple Pay' | 'Google Pay' | 'Cash on Delivery';
  trackingNumber: string;
  appliedPromo?: string;
}

export interface CustomerInquiry {
  id: string;
  date: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'New' | 'In Progress' | 'Resolved';
}

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  active: boolean;
}

export type ViewMode = 
  | 'landing' 
  | 'shop' 
  | 'product-detail' 
  | 'cart' 
  | 'checkout' 
  | 'order-success' 
  | 'compare' 
  | 'trade-in' 
  | 'contact' 
  | 'privacy' 
  | 'admin';
