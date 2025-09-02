// Nigerian-specific constants and utilities for the marketplace

export const NIGERIAN_LOCATIONS = {
  LAGOS: {
    state: 'Lagos',
    areas: [
      'Ikeja', 'Victoria Island', 'Ikoyi', 'Lekki', 'Ajah', 'Surulere', 
      'Yaba', 'Gbagada', 'Ketu', 'Mile 2', 'Alaba', 'Mushin', 
      'Shomolu', 'Bariga', 'Ikorodu', 'Epe', 'Badagry', 'Lagos Island',
      'Apapa', 'Festac', 'Satellite Town', 'Agege', 'Ifako-Ijaiye',
      'Kosofe', 'Oshodi-Isolo', 'Somolu', 'Lagos Mainland', 'Eti-Osa'
    ]
  },
  ABUJA: {
    state: 'Federal Capital Territory',
    areas: [
      'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa',
      'Karu', 'Nyanya', 'Lugbe', 'Gwagwalada', 'Bwari', 'Abaji'
    ]
  },
  KANO: {
    state: 'Kano',
    areas: [
      'Fagge', 'Dala', 'Gwale', 'Kano Municipal', 'Nasarawa', 'Tarauni',
      'Ungogo', 'Kumbotso', 'Warawa', 'Gezawa'
    ]
  },
  PORT_HARCOURT: {
    state: 'Rivers',
    areas: [
      'Port Harcourt Township', 'Diobu', 'Mile 1', 'Mile 2', 'Mile 3',
      'Rumuola', 'GRA Phase 1', 'GRA Phase 2', 'Trans Amadi', 'Eleme'
    ]
  }
};

export const NIGERIAN_PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Cash on Delivery',
    icon: '💵',
    description: 'Pay with cash when item is delivered'
  },
  {
    id: 'transfer',
    name: 'Bank Transfer',
    icon: '🏦',
    description: 'Direct bank transfer (GTB, Zenith, First Bank, etc.)'
  },
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    icon: '📱',
    description: 'Opay, PalmPay, Kuda, etc.'
  },
  {
    id: 'pos',
    name: 'POS Payment',
    icon: '💳',
    description: 'Pay with debit card via POS'
  },
  {
    id: 'paystack',
    name: 'Online Payment',
    icon: '🌐',
    description: 'Secure online payment via Paystack/Flutterwave'
  }
];

export const NIGERIAN_DELIVERY_OPTIONS = [
  {
    id: 'pickup',
    name: 'Pickup from Location',
    icon: '🚶‍♂️',
    cost: 'Free',
    time: 'Immediate',
    description: 'Meet at agreed location'
  },
  {
    id: 'same_day',
    name: 'Same-Day Delivery (Lagos)',
    icon: '🏃‍♂️',
    cost: '₦1,500 - ₦3,000',
    time: 'Same day',
    description: 'Delivered within Lagos same day'
  },
  {
    id: 'interstate',
    name: 'Interstate Delivery',
    icon: '🚛',
    cost: '₦3,000 - ₦8,000',
    time: '2-5 days',
    description: 'Delivery to other states via GIG, DHL, etc.'
  },
  {
    id: 'dispatch',
    name: 'Dispatch Rider',
    icon: '🏍️',
    cost: '₦500 - ₦2,000',
    time: '1-3 hours',
    description: 'Local dispatch within city'
  }
];

export const NIGERIAN_BUSINESS_HOURS = {
  WEEKDAYS: '8:00 AM - 6:00 PM',
  SATURDAY: '9:00 AM - 4:00 PM',
  SUNDAY: 'Closed (Emergency only)',
  RAMADAN: '9:00 AM - 3:00 PM, 7:00 PM - 9:00 PM',
  HOLIDAYS: 'Closed'
};

export const NIGERIAN_SERVICE_PRICING = {
  'Plumbing': { min: 5000, max: 25000, unit: 'per visit' },
  'Electrical Work': { min: 3000, max: 50000, unit: 'per job' },
  'Generator Repair': { min: 8000, max: 30000, unit: 'per repair' },
  'AC Repair': { min: 7000, max: 20000, unit: 'per service' },
  'Cleaning Services': { min: 8000, max: 15000, unit: 'per day' },
  'Security Services': { min: 25000, max: 60000, unit: 'per month' },
  'Catering': { min: 2000, max: 5000, unit: 'per person' },
  'Photography': { min: 50000, max: 200000, unit: 'per event' },
  'Tailoring': { min: 5000, max: 25000, unit: 'per item' },
  'Tutoring': { min: 8000, max: 20000, unit: 'per month' }
};

export const NIGERIAN_PHONE_CARRIERS = [
  { name: 'MTN', prefixes: ['0803', '0806', '0813', '0816', '0903', '0906', '0913', '0916'], color: '#FFCC00' },
  { name: 'Airtel', prefixes: ['0802', '0808', '0812', '0901', '0904', '0907', '0912'], color: '#FF0000' },
  { name: 'Glo', prefixes: ['0805', '0807', '0811', '0815', '0905', '0915'], color: '#00FF00' },
  { name: '9mobile', prefixes: ['0809', '0817', '0818', '0908', '0909'], color: '#00AA00' }
];

export const NIGERIAN_CURRENCY_FORMATTER = {
  format: (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },
  
  formatCompact: (amount: number): string => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`;
    }
    return `₦${amount.toLocaleString()}`;
  },
  
  parse: (priceString: string): number => {
    return parseFloat(priceString.replace(/[₦,]/g, ''));
  }
};

export const NIGERIAN_MARKETPLACE_TERMS = {
  // Estate/Housing terminology
  'Neighborhood': 'Estate',
  'Apartment': 'Flat',
  'Condo': 'Duplex',
  'HOA': 'Estate Association',
  'Community': 'Estate/Compound',
  
  // Business terms
  'Store': 'Shop',
  'Mall': 'Plaza/Mall',
  'Parking': 'Car Park',
  'Gas Station': 'Filling Station',
  'Pharmacy': 'Chemist',
  
  // Transportation
  'Uber/Taxi': 'Bolt/Uber/Okada',
  'Bus': 'Danfo/BRT/Molue',
  'Subway': 'BRT',
  
  // Common phrases
  'Deal': 'Sharp deal',
  'Good condition': 'Still dey work well',
  'Excellent': 'Tear rubber',
  'Cheap': 'Affordable/Budget-friendly',
  'Expensive': 'Cost plenty',
  'Negotiable': 'Price negotiable',
  'Final price': 'Last price',
  'Cash only': 'Cash and carry'
};

export const NIGERIAN_SAFETY_TIPS = [
  '🛡️ Meet in public places for transactions',
  '👥 Bring a friend when meeting strangers',
  '💵 Inspect items before paying',
  '📱 Keep communication on the app initially',
  '🆔 Ask for ID verification for expensive items',
  '🏪 Meet at busy locations like malls or markets',
  '⏰ Meet during daylight hours when possible',
  '📍 Share your location with friends/family'
];

export const NIGERIAN_BUSINESS_CATEGORIES = {
  'Food & Drinks': [
    'Restaurants', 'Fast Food', 'Bakeries', 'Drinks/Beverages', 
    'Catering Services', 'Food Vendors', 'Suya Spots'
  ],
  'Transportation': [
    'Car Hire', 'Dispatch Services', 'Moving Services', 
    'Airport Transfers', 'Interstate Travel'
  ],
  'Health & Beauty': [
    'Salons', 'Barbershops', 'Spas', 'Pharmacies/Chemist', 
    'Fitness Centers', 'Beauty Products'
  ],
  'Professional Services': [
    'Legal Services', 'Accounting', 'Real Estate', 'Insurance',
    'Consulting', 'IT Services', 'Marketing'
  ],
  'Education': [
    'Tutoring', 'Computer Training', 'Music Lessons', 'Language Classes',
    'Skill Acquisition', 'Professional Training'
  ]
};

// Helper functions
export const getNigerianPhoneCarrier = (phoneNumber: string): string | null => {
  const prefix = phoneNumber.substring(0, 4);
  const carrier = NIGERIAN_PHONE_CARRIERS.find(c => 
    c.prefixes.includes(prefix)
  );
  return carrier ? carrier.name : null;
};

export const formatNigerianPhoneNumber = (phoneNumber: string): string => {
  // Convert to standard Nigerian format
  let formatted = phoneNumber.replace(/\D/g, '');
  
  if (formatted.startsWith('234')) {
    formatted = '0' + formatted.substring(3);
  } else if (formatted.startsWith('+234')) {
    formatted = '0' + formatted.substring(4);
  }
  
  return formatted;
};

export const isValidNigerianPhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatNigerianPhoneNumber(phoneNumber);
  return formatted.length === 11 && formatted.startsWith('0');
};

export const getNearbyLocations = (userLocation: string): string[] => {
  // Simple implementation - in real app would use geolocation
  const location = userLocation.toLowerCase();
  
  if (location.includes('lagos')) {
    return NIGERIAN_LOCATIONS.LAGOS.areas.slice(0, 5);
  } else if (location.includes('abuja')) {
    return NIGERIAN_LOCATIONS.ABUJA.areas.slice(0, 5);
  } else if (location.includes('kano')) {
    return NIGERIAN_LOCATIONS.KANO.areas.slice(0, 5);
  }
  
  return ['Within 5km', 'Within 10km', 'Within 15km'];
};