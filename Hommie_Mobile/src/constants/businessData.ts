// Business and professional service data for Nigerian context

export const BUSINESS_CATEGORIES = [
  {
    id: 'household-services',
    name: 'Household Services',
    icon: 'home-variant',
    color: '#00A651',
    description: 'Home maintenance and household help',
    subcategories: [
      'Cleaning Services',
      'Laundry & Dry Cleaning',
      'Home Repairs',
      'Plumbing',
      'Electrical Work',
      'Air Conditioning',
      'Pest Control',
      'Gardening & Landscaping',
      'Security Services',
      'Domestic Staff',
    ],
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    icon: 'briefcase',
    color: '#0066CC',
    description: 'Licensed professional services',
    subcategories: [
      'Legal Services',
      'Accounting & Tax',
      'Real Estate',
      'Insurance',
      'Financial Planning',
      'Consulting',
      'Architecture',
      'Engineering',
      'Medical Services',
      'Dental Care',
    ],
  },
  {
    id: 'technology',
    name: 'Technology Services',
    icon: 'laptop',
    color: '#7B68EE',
    description: 'IT and digital services',
    subcategories: [
      'Computer Repair',
      'Software Development',
      'Web Design',
      'Digital Marketing',
      'IT Support',
      'CCTV Installation',
      'Satellite TV Setup',
      'Phone Repair',
      'Data Recovery',
      'Network Setup',
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive Services',
    icon: 'car-wrench',
    color: '#FF6B35',
    description: 'Vehicle services and repairs',
    subcategories: [
      'Auto Repair',
      'Car Wash',
      'Tyre Services',
      'Auto Parts',
      'Car Rental',
      'Driving School',
      'Vehicle Registration',
      'Insurance Claims',
      'Roadside Assistance',
      'Car Sales',
    ],
  },
  {
    id: 'food-catering',
    name: 'Food & Catering',
    icon: 'food-variant',
    color: '#FFC107',
    description: 'Food services and catering',
    subcategories: [
      'Event Catering',
      'Home Cooking',
      'Baking Services',
      'Restaurant Delivery',
      'Meal Prep',
      'Grocery Delivery',
      'Speciality Foods',
      'Catering Equipment',
      'Food Supplies',
      'Nutritionist',
    ],
  },
  {
    id: 'education-tutoring',
    name: 'Education & Tutoring',
    icon: 'school',
    color: '#E74C3C',
    description: 'Educational and training services',
    subcategories: [
      'Private Tutoring',
      'Language Classes',
      'Music Lessons',
      'Art Classes',
      'Computer Training',
      'Professional Courses',
      'Test Preparation',
      'Children\'s Lessons',
      'Adult Education',
      'Skills Training',
    ],
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    icon: 'medical-bag',
    color: '#228B22',
    description: 'Health and wellness services',
    subcategories: [
      'Home Healthcare',
      'Fitness Training',
      'Massage Therapy',
      'Mental Health',
      'Nutrition Counseling',
      'Elderly Care',
      'Childcare',
      'Beauty Services',
      'Spa Services',
      'Medical Equipment',
    ],
  },
  {
    id: 'events-entertainment',
    name: 'Events & Entertainment',
    icon: 'calendar-check',
    color: '#FF69B4',
    description: 'Event and entertainment services',
    subcategories: [
      'Event Planning',
      'Photography',
      'Videography',
      'DJ Services',
      'Live Music',
      'Party Equipment',
      'Decorations',
      'Entertainment',
      'Wedding Planning',
      'Corporate Events',
    ],
  },
];

export const SERVICE_AREAS = [
  {
    id: 'estate-only',
    name: 'Estate Only',
    description: 'Services available only within your estate',
    radius: 0,
  },
  {
    id: 'neighborhood',
    name: 'Neighborhood (2km)',
    description: 'Services within 2km radius',
    radius: 2,
  },
  {
    id: 'district',
    name: 'District (5km)',
    description: 'Services within 5km radius',
    radius: 5,
  },
  {
    id: 'city-wide',
    name: 'City-wide (15km)',
    description: 'Services within 15km radius',
    radius: 15,
  },
  {
    id: 'state-wide',
    name: 'State-wide',
    description: 'Services across the state',
    radius: -1,
  },
];

export const BUSINESS_VERIFICATION_LEVELS = [
  {
    id: 'basic',
    name: 'Basic Verification',
    description: 'Phone number and estate address verified',
    badge: 'shield-check',
    color: '#00A651',
    requirements: ['Phone verification', 'Estate address confirmation'],
  },
  {
    id: 'enhanced',
    name: 'Enhanced Verification',
    description: 'Government business registration verified',
    badge: 'shield-star',
    color: '#0066CC',
    requirements: ['Basic verification', 'CAC registration', 'Tax ID (TIN)'],
  },
  {
    id: 'premium',
    name: 'Premium Verification',
    description: 'Professional licenses and insurance verified',
    badge: 'shield-crown',
    color: '#FFC107',
    requirements: ['Enhanced verification', 'Professional licenses', 'Insurance coverage'],
  },
];

export const PRICING_MODELS = [
  {
    id: 'fixed-rate',
    name: 'Fixed Rate',
    description: 'Set price for specific services',
    example: '₦5,000 per service',
  },
  {
    id: 'hourly-rate',
    name: 'Hourly Rate',
    description: 'Charge by the hour',
    example: '₦2,000 per hour',
  },
  {
    id: 'project-based',
    name: 'Project-based',
    description: 'Quote per project',
    example: 'Custom quote',
  },
  {
    id: 'negotiable',
    name: 'Negotiable',
    description: 'Price varies by scope',
    example: 'Call for pricing',
  },
];

export const AVAILABILITY_SCHEDULES = [
  {
    id: 'business-hours',
    name: 'Business Hours',
    description: '9 AM - 5 PM, Monday to Friday',
    hours: { start: '09:00', end: '17:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  },
  {
    id: 'extended-hours',
    name: 'Extended Hours',
    description: '8 AM - 8 PM, Monday to Saturday',
    hours: { start: '08:00', end: '20:00', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
  },
  {
    id: 'weekend-available',
    name: 'Weekend Available',
    description: 'Available on weekends',
    hours: { start: '09:00', end: '17:00', days: ['sat', 'sun'] },
  },
  {
    id: 'twenty-four-seven',
    name: '24/7 Emergency',
    description: 'Available 24 hours for emergencies',
    hours: { start: '00:00', end: '23:59', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
  },
  {
    id: 'flexible',
    name: 'Flexible Schedule',
    description: 'Available by appointment',
    hours: null,
  },
];

export const NIGERIAN_BUSINESS_LICENSES = [
  {
    category: 'General Business',
    licenses: [
      'Certificate of Incorporation (CAC)',
      'Tax Identification Number (TIN)',
      'VAT Registration',
      'Business Permit',
      'Fire Safety Certificate',
      'Environmental Impact Assessment',
    ],
  },
  {
    category: 'Healthcare',
    licenses: [
      'Medical License (MDCN)',
      'Nursing License',
      'Pharmacy License (PCN)',
      'Health Facility License',
      'NAFDAC Registration',
    ],
  },
  {
    category: 'Food Services',
    licenses: [
      'Food Handler\'s License',
      'NAFDAC Number',
      'Health Certificate',
      'Restaurant License',
      'Catering Permit',
    ],
  },
  {
    category: 'Construction',
    licenses: [
      'Contractor\'s License',
      'Building Permit',
      'Engineer Registration (COREN)',
      'Architect Registration (ARCON)',
      'Safety Compliance Certificate',
    ],
  },
  {
    category: 'Transportation',
    licenses: [
      'Commercial Driver\'s License',
      'Vehicle Registration',
      'Road Worthiness Certificate',
      'Commercial Vehicle Permit',
      'Insurance Certificate',
    ],
  },
  {
    category: 'Education',
    licenses: [
      'Teaching License (TRCN)',
      'School Registration',
      'Educational Permit',
      'Professional Certification',
    ],
  },
];

export const PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Cash',
    description: 'Cash payment on service delivery',
    icon: 'cash',
    popular: true,
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    description: 'Direct bank account transfer',
    icon: 'bank',
    popular: true,
  },
  {
    id: 'mobile-money',
    name: 'Mobile Money',
    description: 'MTN MoMo, Airtel Money, etc.',
    icon: 'cellphone',
    popular: true,
  },
  {
    id: 'pos',
    name: 'POS Terminal',
    description: 'Card payment via POS',
    icon: 'credit-card-outline',
    popular: false,
  },
  {
    id: 'online-payment',
    name: 'Online Payment',
    description: 'Paystack, Flutterwave, etc.',
    icon: 'web',
    popular: false,
  },
  {
    id: 'installment',
    name: 'Installment',
    description: 'Payment in installments',
    icon: 'calendar-multiple',
    popular: false,
  },
];

export const CUSTOMER_REVIEW_CRITERIA = [
  {
    id: 'quality',
    name: 'Quality of Work',
    description: 'How well was the service performed?',
    weight: 0.3,
  },
  {
    id: 'timeliness',
    name: 'Timeliness',
    description: 'Was the service delivered on time?',
    weight: 0.25,
  },
  {
    id: 'professionalism',
    name: 'Professionalism',
    description: 'How professional was the service provider?',
    weight: 0.2,
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'How well did they communicate?',
    weight: 0.15,
  },
  {
    id: 'value',
    name: 'Value for Money',
    description: 'Was the price fair for the service?',
    weight: 0.1,
  },
];

export const SERVICE_GUARANTEES = [
  {
    id: 'satisfaction-guarantee',
    name: 'Satisfaction Guarantee',
    description: 'Money back if not satisfied',
    icon: 'thumb-up',
  },
  {
    id: 'warranty',
    name: 'Service Warranty',
    description: 'Warranty on work performed',
    icon: 'shield-check',
  },
  {
    id: 'insurance-covered',
    name: 'Insurance Covered',
    description: 'Service provider is insured',
    icon: 'security',
  },
  {
    id: 'background-checked',
    name: 'Background Checked',
    description: 'Background verification completed',
    icon: 'account-check',
  },
  {
    id: 'licensed-professional',
    name: 'Licensed Professional',
    description: 'Holds relevant professional licenses',
    icon: 'certificate',
  },
];

export const formatNairaCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
};

export const calculateAverageRating = (reviews: any[]): number => {
  if (reviews.length === 0) return 0;
  
  const weightedSum = reviews.reduce((sum, review) => {
    const criteriaSum = CUSTOMER_REVIEW_CRITERIA.reduce((criteriaSum, criteria) => {
      return criteriaSum + (review.ratings[criteria.id] * criteria.weight);
    }, 0);
    return sum + criteriaSum;
  }, 0);
  
  return Math.round((weightedSum / reviews.length) * 10) / 10;
};

export const getBusinessCategoryById = (categoryId: string) => {
  return BUSINESS_CATEGORIES.find(category => category.id === categoryId);
};

export const getSubcategoriesByCategory = (categoryId: string) => {
  const category = getBusinessCategoryById(categoryId);
  return category ? category.subcategories : [];
};

export const filterBusinessesByLocation = (businesses: any[], userLocation: any, maxDistance: number) => {
  if (maxDistance === -1) return businesses; // State-wide
  if (maxDistance === 0) return businesses.filter(b => b.estateId === userLocation.estateId); // Estate only
  
  // Distance-based filtering (would use real geolocation in production)
  return businesses.filter(business => {
    const distance = calculateDistance(userLocation, business.location);
    return distance <= maxDistance;
  });
};

const calculateDistance = (loc1: any, loc2: any): number => {
  // Simplified distance calculation (would use proper geolocation in production)
  return Math.random() * 10; // Mock distance
};