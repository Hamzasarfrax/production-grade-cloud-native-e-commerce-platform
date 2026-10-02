import { PhoneProduct, Order, CustomerInquiry, PromoCode } from '../types';
import heroBannerImg from '../assets/images/mxmobilz_hero_banner_1786561492897.jpg';

export { heroBannerImg };

export const INITIAL_PRODUCTS: PhoneProduct[] = [
  {
    id: 'prod-iphone-16-pro-max',
    name: 'Apple iPhone 16 Pro Max',
    brand: 'Apple',
    model: '16 Pro Max',
    os: 'iOS',
    price: 1199,
    originalPrice: 1299,
    rating: 4.9,
    reviewsCount: 342,
    inStock: 18,
    storageOptions: ['256GB', '512GB', '1TB'],
    colorOptions: [
      { name: 'Desert Titanium', hex: '#c5b59f' },
      { name: 'Natural Titanium', hex: '#ba9f8e' },
      { name: 'White Titanium', hex: '#f0ece1' },
      { name: 'Black Titanium', hex: '#3d3d3d' }
    ],
    ram: '8GB',
    battery: '4685 mAh',
    camera: '48MP Main + 48MP Ultra-Wide + 12MP 5x Telephoto',
    processor: 'Apple A18 Pro (3nm)',
    display: '6.9" Super Retina XDR OLED 120Hz ProMotion',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80'
    ],
    condition: 'New',
    is5G: true,
    isFeatured: true,
    isBestSeller: true,
    description: 'The ultimate iPhone engineered with grade 5 titanium, groundbreaking A18 Pro chip, and revolutionary Camera Control button for cinematic video capture.',
    specs: {
      screenSize: '6.9 inches',
      refreshRate: '120Hz ProMotion',
      chipset: 'Apple A18 Pro',
      mainCamera: '48MP Fusion Camera',
      frontCamera: '12MP TrueDepth',
      batteryCapacity: '4685 mAh (Up to 33 hrs video playback)',
      chargingSpeed: '25W MagSafe / 50% in 30 mins',
      weight: '227 grams',
      osVersion: 'iOS 18',
      waterResistance: 'IP68 (6 meters up to 30 mins)'
    },
    reviewsList: [
      {
        id: 'rev-1',
        userName: 'Marcus Vance',
        rating: 5,
        date: '2026-07-14',
        comment: 'The desert titanium color is gorgeous in person! Battery easily lasts 2 full days of heavy usage.',
        verifiedPurchase: true
      },
      {
        id: 'rev-2',
        userName: 'Elena Rostova',
        rating: 5,
        date: '2026-07-02',
        comment: 'The Camera Control button is a game changer for quick snaps and video recording. Mxmobilz shipped it within 24 hours!',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-galaxy-s25-ultra',
    name: 'Samsung Galaxy S25 Ultra',
    brand: 'Samsung',
    model: 'Galaxy S25 Ultra',
    os: 'Android',
    price: 1299,
    originalPrice: 1399,
    rating: 4.9,
    reviewsCount: 289,
    inStock: 14,
    storageOptions: ['256GB', '512GB', '1TB'],
    colorOptions: [
      { name: 'Titanium Blue', hex: '#4a627a' },
      { name: 'Titanium Black', hex: '#2b2c2e' },
      { name: 'Titanium Gray', hex: '#8e9094' },
      { name: 'Titanium Silver', hex: '#d4d6db' }
    ],
    ram: '12GB',
    battery: '5000 mAh',
    camera: '200MP Main + 50MP Periscope + 50MP Ultra-Wide + 10MP Telephoto',
    processor: 'Snapdragon 8 Elite for Galaxy',
    display: '6.8" Dynamic AMOLED 2X 120Hz Anti-Reflective',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80'
    ],
    condition: 'New',
    is5G: true,
    isFeatured: true,
    isBestSeller: true,
    description: 'Unrivaled Galaxy AI power paired with built-in S Pen, 200MP Quad Tele System camera, and glare-free Armor Aluminum & Titanium frame.',
    specs: {
      screenSize: '6.8 inches',
      refreshRate: '120Hz LTPO',
      chipset: 'Snapdragon 8 Elite (3nm)',
      mainCamera: '200MP Ultra-Clear',
      frontCamera: '12MP Dual Pixel',
      batteryCapacity: '5000 mAh',
      chargingSpeed: '45W Super Fast Charging 2.0',
      weight: '219 grams',
      osVersion: 'Android 15 (One UI 7)',
      waterResistance: 'IP68 Dust & Water Resistant'
    },
    reviewsList: [
      {
        id: 'rev-3',
        userName: 'David Miller',
        rating: 5,
        date: '2026-06-28',
        comment: 'Galaxy AI photo editing features are unbelievable. Highly recommend buying from Mxmobilz.',
        verifiedPurchase: true
      }
    ]
  },
  {
    id: 'prod-iphone-16-pro',
    name: 'Apple iPhone 16 Pro',
    brand: 'Apple',
    model: '16 Pro',
    os: 'iOS',
    price: 999,
    originalPrice: 1099,
    rating: 4.8,
    reviewsCount: 215,
    inStock: 22,
    storageOptions: ['128GB', '256GB', '512GB', '1TB'],
    colorOptions: [
      { name: 'Natural Titanium', hex: '#ba9f8e' },
      { name: 'Black Titanium', hex: '#3d3d3d' },
      { name: 'White Titanium', hex: '#f0ece1' }
    ],
    ram: '8GB',
    battery: '3582 mAh',
    camera: '48MP Main + 48MP Ultra-Wide + 12MP 5x Telephoto',
    processor: 'Apple A18 Pro',
    display: '6.3" Super Retina XDR OLED',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80'
    ],
    condition: 'New',
    is5G: true,
    isFeatured: true,
    isBestSeller: false,
    description: 'Pro performance in a compact 6.3-inch titanium frame. Powered by Apple Intelligence and 4K 120 fps Dolby Vision recording.',
    specs: {
      screenSize: '6.3 inches',
      refreshRate: '120Hz ProMotion',
      chipset: 'Apple A18 Pro',
      mainCamera: '48MP Fusion Camera',
      frontCamera: '12MP TrueDepth',
      batteryCapacity: '3582 mAh',
      chargingSpeed: '25W MagSafe Wireless',
      weight: '199 grams',
      osVersion: 'iOS 18',
      waterResistance: 'IP68'
    }
  },
  {
    id: 'prod-google-pixel-9-pro',
    name: 'Google Pixel 9 Pro XL',
    brand: 'Google',
    model: 'Pixel 9 Pro XL',
    os: 'Android',
    price: 1099,
    originalPrice: 1199,
    rating: 4.8,
    reviewsCount: 178,
    inStock: 12,
    storageOptions: ['128GB', '256GB', '512GB'],
    colorOptions: [
      { name: 'Obsidian', hex: '#1c1d1f' },
      { name: 'Porcelain', hex: '#f2f0ea' },
      { name: 'Hazel', hex: '#777e77' },
      { name: 'Rose Quartz', hex: '#e8cbcc' }
    ],
    ram: '16GB',
    battery: '5060 mAh',
    camera: '50MP Main + 48MP Ultra-Wide + 48MP 5x Telephoto',
    processor: 'Google Tensor G4 + Titan M2',
    display: '6.8" Super Actua OLED 120Hz 3000 nits',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80'
    ],
    condition: 'New',
    is5G: true,
    isFeatured: true,
    isBestSeller: true,
    description: 'The most powerful Pixel yet featuring Gemini Nano AI built into Android, unbelievable computational photography, and 7 years of OS updates.',
    specs: {
      screenSize: '6.8 inches',
      refreshRate: '120Hz Super Actua Display',
      chipset: 'Google Tensor G4',
      mainCamera: '50MP Octa PD',
      frontCamera: '42MP Dual PD Selfie',
      batteryCapacity: '5060 mAh',
      chargingSpeed: '37W Wired Fast Charge',
      weight: '221 grams',
      osVersion: 'Android 15 Pure Pixel',
      waterResistance: 'IP68'
    }
  },
  {
    id: 'prod-oneplus-13',
    name: 'OnePlus 13 5G',
    brand: 'OnePlus',
    model: '13 5G',
    os: 'Android',
    price: 899,
    originalPrice: 999,
    rating: 4.7,
    reviewsCount: 142,
    inStock: 25,
    storageOptions: ['256GB', '512GB'],
    colorOptions: [
      { name: 'Midnight Black', hex: '#191919' },
      { name: 'Emerald Green', hex: '#1f4838' },
      { name: 'Arctic White', hex: '#e8ebee' }
    ],
    ram: '16GB',
    battery: '6000 mAh',
    camera: '50MP Hasselblad Main + 50MP Telephoto + 50MP Ultra-Wide',
    processor: 'Snapdragon 8 Elite',
    display: '6.82" 2K 120Hz ProXDR AMOLED',
    image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80'
    ],
    condition: 'New',
    is5G: true,
    isFeatured: false,
    isBestSeller: true,
    description: 'Extreme performance phone with massive 6000 mAh Glacier Battery, 100W SUPERVOOC charging, and 50MP Hasselblad Camera System.',
    specs: {
      screenSize: '6.82 inches',
      refreshRate: '120Hz LTPO4',
      chipset: 'Snapdragon 8 Elite',
      mainCamera: '50MP Sony LYT-808',
      frontCamera: '32MP Sony IMX615',
      batteryCapacity: '6000 mAh Glacier Battery',
      chargingSpeed: '100W Wired / 50W AIRVOOC Wireless',
      weight: '213 grams',
      osVersion: 'OxygenOS 15 (Android 15)',
      waterResistance: 'IP68 / IP69'
    }
  },
  {
    id: 'prod-galaxy-z-fold-6',
    name: 'Samsung Galaxy Z Fold 6',
    brand: 'Samsung',
    model: 'Galaxy Z Fold 6',
    os: 'Android',
    price: 1699,
    originalPrice: 1899,
    rating: 4.7,
    reviewsCount: 96,
    inStock: 8,
    storageOptions: ['256GB', '512GB', '1TB'],
    colorOptions: [
      { name: 'Navy', hex: '#1b2a3a' },
      { name: 'Silver Shadow', hex: '#8a8d91' },
      { name: 'Pink', hex: '#f0d3d3' }
    ],
    ram: '12GB',
    battery: '4400 mAh',
    camera: '50MP Main + 12MP Ultra-Wide + 10MP 3x Telephoto',
    processor: 'Snapdragon 8 Gen 3 for Galaxy',
    display: '7.6" Main QXGA+ Dynamic AMOLED 2X + 6.3" Cover',
    image: 'https://images.unsplash.com/photo-1584006682522-dc17d6c0d963?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1584006682522-dc17d6c0d963?auto=format&fit=crop&w=800&q=80'
    ],
    condition: 'New',
    is5G: true,
    isFeatured: true,
    isBestSeller: false,
    description: 'Ultra-slim dual screen foldable powerhouse. Multitask with 3 split-screen windows, Galaxy AI circle to search, and S Pen support.',
    specs: {
      screenSize: '7.6 inch Unfolded / 6.3 inch Cover',
      refreshRate: '120Hz Dual AMOLED',
      chipset: 'Snapdragon 8 Gen 3',
      mainCamera: '50MP OIS Wide',
      frontCamera: '10MP Cover + 4MP Under Display',
      batteryCapacity: '4400 mAh Dual Battery',
      chargingSpeed: '25W Super Fast Charge',
      weight: '239 grams',
      osVersion: 'Android 14 (One UI 6.1.1)',
      waterResistance: 'IP48 Water Resistant'
    }
  },
  {
    id: 'prod-iphone-15-refurbished',
    name: 'Apple iPhone 15 Pro (Certified Refurbished)',
    brand: 'Apple',
    model: '15 Pro',
    os: 'iOS',
    price: 749,
    originalPrice: 999,
    rating: 4.9,
    reviewsCount: 512,
    inStock: 30,
    storageOptions: ['128GB', '256GB', '512GB'],
    colorOptions: [
      { name: 'Natural Titanium', hex: '#ba9f8e' },
      { name: 'Blue Titanium', hex: '#263342' },
      { name: 'Black Titanium', hex: '#3d3d3d' }
    ],
    ram: '8GB',
    battery: '3274 mAh (100% Health Guaranteed)',
    camera: '48MP Main + 12MP Ultra-Wide + 12MP 3x Telephoto',
    processor: 'Apple A17 Pro (3nm)',
    display: '6.1" Super Retina XDR OLED 120Hz',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'
    ],
    condition: 'Certified Refurbished',
    is5G: true,
    isFeatured: false,
    isBestSeller: true,
    description: 'Certified 90-point inspection refurbished iPhone 15 Pro with brand new outer shell, 100% battery capacity, and 1-Year Mxmobilz Store Warranty.',
    specs: {
      screenSize: '6.1 inches',
      refreshRate: '120Hz ProMotion',
      chipset: 'Apple A17 Pro',
      mainCamera: '48MP Pro System',
      frontCamera: '12MP TrueDepth',
      batteryCapacity: '3274 mAh',
      chargingSpeed: '20W Fast Charge',
      weight: '187 grams',
      osVersion: 'iOS 18 Ready',
      waterResistance: 'IP68'
    }
  },
  {
    id: 'prod-xiaomi-15-ultra',
    name: 'Xiaomi 15 Ultra 5G',
    brand: 'Xiaomi',
    model: '15 Ultra',
    os: 'Android',
    price: 1149,
    originalPrice: 1249,
    rating: 4.8,
    reviewsCount: 88,
    inStock: 10,
    storageOptions: ['256GB', '512GB', '1TB'],
    colorOptions: [
      { name: 'Leica Black', hex: '#111111' },
      { name: 'Titanium Gray', hex: '#77797e' },
      { name: 'Silver Chrome', hex: '#e2e4e8' }
    ],
    ram: '16GB',
    battery: '5300 mAh',
    camera: '50MP Leica 1-inch sensor + 200MP Periscope Telephoto + 50MP Ultra-Wide',
    processor: 'Snapdragon 8 Elite',
    display: '6.73" WQHD+ 120Hz AMOLED 3000 nits',
    image: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=800&q=80'
    ],
    condition: 'New',
    is5G: true,
    isFeatured: false,
    isBestSeller: false,
    description: 'Masterpiece mobile photography developed with Leica. Features massive 1-inch optical camera sensor and 90W HyperCharge.',
    specs: {
      screenSize: '6.73 inches',
      refreshRate: '120Hz LTPO AMOLED',
      chipset: 'Snapdragon 8 Elite',
      mainCamera: '50MP Leica Quad Camera',
      frontCamera: '32MP HDR Selfie',
      batteryCapacity: '5300 mAh',
      chargingSpeed: '90W HyperCharge / 80W Wireless',
      weight: '220 grams',
      osVersion: 'Xiaomi HyperOS 2 (Android 15)',
      waterResistance: 'IP68'
    }
  },
  {
    id: 'prod-nothing-phone-2a',
    name: 'Nothing Phone (2a) Plus',
    brand: 'Nothing',
    model: 'Phone (2a) Plus',
    os: 'Android',
    price: 399,
    originalPrice: 449,
    rating: 4.6,
    reviewsCount: 164,
    inStock: 35,
    storageOptions: ['128GB', '256GB'],
    colorOptions: [
      { name: 'Metallic Gray', hex: '#40454a' },
      { name: 'Glyph Black', hex: '#18191a' },
      { name: 'Milk White', hex: '#f0f0f2' }
    ],
    ram: '12GB',
    battery: '5000 mAh',
    camera: '50MP OIS Main + 50MP Ultra-Wide + 50MP Front Selfie',
    processor: 'MediaTek Dimensity 7350 Pro 5G',
    display: '6.7" FHD+ 120Hz Flexible AMOLED',
    image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=800&q=80'
    ],
    condition: 'New',
    is5G: true,
    isFeatured: false,
    isBestSeller: true,
    description: 'Iconic transparent Glyph Interface design paired with bloatware-free Nothing OS, triple 50MP cameras, and crisp 120Hz AMOLED.',
    specs: {
      screenSize: '6.7 inches',
      refreshRate: '120Hz Flexible AMOLED',
      chipset: 'MediaTek Dimensity 7350 Pro',
      mainCamera: '50MP Dual Camera',
      frontCamera: '50MP Ultra-Sharp Selfie',
      batteryCapacity: '5000 mAh',
      chargingSpeed: '50W Fast Charging',
      weight: '190 grams',
      osVersion: 'Nothing OS 2.6',
      waterResistance: 'IP54 Water Resistant'
    }
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'MX-98214',
    date: '2026-08-11',
    shippingDetails: {
      fullName: 'Alexander Wright',
      email: 'alex.wright@techmail.com',
      phone: '+1 (555) 234-5678',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704',
      country: 'United States'
    },
    items: [
      {
        id: 'cart-item-1',
        product: INITIAL_PRODUCTS[0], // iPhone 16 Pro Max
        selectedStorage: '512GB',
        selectedColor: INITIAL_PRODUCTS[0].colorOptions[0],
        quantity: 1,
        warrantySelected: true,
        warrantyPrice: 99
      }
    ],
    subtotal: 1299,
    discount: 50,
    shippingFee: 0,
    tax: 102,
    totalAmount: 1350,
    status: 'Processing',
    paymentMethod: 'Credit/Debit Card',
    trackingNumber: 'MXEXP9821443US',
    appliedPromo: 'MXWELCOME50'
  },
  {
    id: 'MX-98212',
    date: '2026-08-10',
    shippingDetails: {
      fullName: 'Sophia Chen',
      email: 'sophia.chen@designhub.io',
      phone: '+1 (555) 876-5432',
      address: '101 Market Street, Suite 400',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'United States'
    },
    items: [
      {
        id: 'cart-item-2',
        product: INITIAL_PRODUCTS[1], // Galaxy S25 Ultra
        selectedStorage: '256GB',
        selectedColor: INITIAL_PRODUCTS[1].colorOptions[0],
        quantity: 1,
        warrantySelected: false,
        warrantyPrice: 0
      }
    ],
    subtotal: 1299,
    discount: 0,
    shippingFee: 0,
    tax: 103,
    totalAmount: 1402,
    status: 'Shipped',
    paymentMethod: 'Apple Pay',
    trackingNumber: 'MXEXP9821211US'
  },
  {
    id: 'MX-98205',
    date: '2026-08-08',
    shippingDetails: {
      fullName: 'David K. Vance',
      email: 'david.vance@gmail.com',
      phone: '+1 (555) 432-1098',
      address: '350 Fifth Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10118',
      country: 'United States'
    },
    items: [
      {
        id: 'cart-item-3',
        product: INITIAL_PRODUCTS[3], // Pixel 9 Pro XL
        selectedStorage: '256GB',
        selectedColor: INITIAL_PRODUCTS[3].colorOptions[1],
        quantity: 1,
        warrantySelected: true,
        warrantyPrice: 79
      }
    ],
    subtotal: 1099,
    discount: 100,
    shippingFee: 0,
    tax: 85,
    totalAmount: 1163,
    status: 'Delivered',
    paymentMethod: 'Google Pay',
    trackingNumber: 'MXEXP9820588US',
    appliedPromo: 'PIXELPRO100'
  }
];

export const INITIAL_INQUIRIES: CustomerInquiry[] = [
  {
    id: 'INQ-101',
    date: '2026-08-11',
    name: 'Robert Hastings',
    email: 'robert.h@innovate.co',
    phone: '+1 (555) 901-2233',
    subject: 'Bulk Corporate Order for 15 iPhones',
    message: 'Hello Mxmobilz sales team, we are looking to procure 15 units of iPhone 16 Pro 256GB for our sales executives. Do you offer corporate tax-exempt invoicing and volume discounts?',
    status: 'New'
  },
  {
    id: 'INQ-102',
    date: '2026-08-09',
    name: 'Maria Gomez',
    email: 'm.gomez@outlook.com',
    phone: '+1 (555) 345-6789',
    subject: 'Trade-in value for iPhone 13 Pro Max 256GB',
    message: 'I completed the online trade-in calculator and received a quote of $420. How long is this estimate valid before I ship my old device?',
    status: 'In Progress'
  }
];

export const INITIAL_PROMOS: PromoCode[] = [
  { code: 'MXWELCOME50', discountType: 'fixed', discountValue: 50, minSpend: 500, active: true },
  { code: 'IPHONEPRO100', discountType: 'fixed', discountValue: 100, minSpend: 999, active: true },
  { code: 'ANDROID10', discountType: 'percentage', discountValue: 10, minSpend: 300, active: true }
];

export const STORE_LOCATIONS = [
  {
    id: 'loc-ny',
    city: 'New York Flagship',
    address: '450 Fifth Avenue, Midtown',
    phone: '+1 (212) 555-0199',
    hours: 'Mon - Sat: 9:00 AM - 9:00 PM | Sun: 10:00 AM - 7:00 PM',
    mapImage: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'loc-la',
    city: 'Los Angeles Tech Hub',
    address: '8500 Beverly Blvd, Century City',
    phone: '+1 (310) 555-0144',
    hours: 'Mon - Sat: 10:00 AM - 9:00 PM | Sun: 11:00 AM - 6:00 PM',
    mapImage: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'loc-chi',
    city: 'Chicago Experience Center',
    address: '600 N Michigan Ave, Magnificent Mile',
    phone: '+1 (312) 555-0188',
    hours: 'Mon - Sat: 10:00 AM - 8:00 PM | Sun: 11:00 AM - 6:00 PM',
    mapImage: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=600&q=80'
  }
];
