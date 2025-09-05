// Nigerian-specific types and constants
// MeCabal Nigerian Community Platform

// Nigerian Carrier Information
export interface NigerianCarrier {
  name: 'MTN' | 'Airtel' | 'Glo' | '9mobile';
  prefixes: string[];
  color: string;
  logo?: string;
  smsGateway?: string;
}

// Nigerian States
export type NigerianState = 
  | 'Abia' | 'Adamawa' | 'Akwa Ibom' | 'Anambra' | 'Bauchi' | 'Bayelsa' 
  | 'Benue' | 'Borno' | 'Cross River' | 'Delta' | 'Ebonyi' | 'Edo' 
  | 'Ekiti' | 'Enugu' | 'Gombe' | 'Imo' | 'Jigawa' | 'Kaduna' 
  | 'Kano' | 'Katsina' | 'Kebbi' | 'Kogi' | 'Kwara' | 'Lagos' 
  | 'Nasarawa' | 'Niger' | 'Ogun' | 'Ondo' | 'Osun' | 'Oyo' 
  | 'Plateau' | 'Rivers' | 'Sokoto' | 'Taraba' | 'Yobe' | 'Zamfara' 
  | 'FCT' | 'Abuja';

// Nigerian Languages
export type NigerianLanguage = 'en' | 'ha' | 'yo' | 'ig' | 'pidgin';

// Nigerian Currency
export interface NairaCurrency {
  code: 'NGN';
  symbol: '₦';
  name: 'Nigerian Naira';
  subunit: 'kobo';
  subunit_ratio: 100;
}

// Nigerian Address Components
export interface NigerianAddress {
  street?: string;
  area?: string; // Estate, District, Area
  lga: string; // Local Government Area
  state: NigerianState;
  postal_code?: string;
  country: 'Nigeria';
  formatted_address: string;
}

// Nigerian Phone Number
export interface NigerianPhoneNumber {
  raw: string; // +234XXXXXXXXXX
  formatted: string; // +234 XXX XXX XXXX
  carrier: NigerianCarrier['name'];
  is_valid: boolean;
  is_mobile: boolean;
}

// Nigerian Business Categories
export type NigerianBusinessCategory =
  | 'Food & Restaurants'
  | 'Beauty & Personal Care'
  | 'Fashion & Clothing'
  | 'Electronics & Gadgets'
  | 'Home & Garden'
  | 'Health & Medical'
  | 'Education & Training'
  | 'Transportation'
  | 'Financial Services'
  | 'Real Estate'
  | 'Entertainment'
  | 'Sports & Recreation'
  | 'Religious Services'
  | 'Government Services'
  | 'NGO & Community'
  | 'Agriculture'
  | 'Construction'
  | 'Professional Services'
  | 'Retail & Shopping'
  | 'Automotive';

// Nigerian Event Categories
export type NigerianEventCategory =
  | 'Community Meeting'
  | 'Religious Service'
  | 'Cultural Festival'
  | 'Traditional Wedding'
  | 'Naming Ceremony'
  | 'Birthday Party'
  | 'Business Networking'
  | 'Educational Workshop'
  | 'Sports Competition'
  | 'Music Concert'
  | 'Art Exhibition'
  | 'Food Festival'
  | 'Charity Drive'
  | 'Political Rally'
  | 'Youth Program'
  | 'Women\'s Meeting'
  | 'Children\'s Event'
  | 'Health Campaign'
  | 'Environmental Cleanup'
  | 'Security Meeting';

// Nigerian Post Categories
export type NigerianPostCategory =
  | 'General Discussion'
  | 'Estate Updates'
  | 'Security Alert'
  | 'Lost & Found'
  | 'Buy & Sell'
  | 'Job Opportunities'
  | 'Services Needed'
  | 'Event Announcement'
  | 'Recommendations'
  | 'Complaints'
  | 'Appreciation'
  | 'News & Information'
  | 'Emergency Notice'
  | 'Maintenance Alert'
  | 'Community Rules'
  | 'Welcome New Neighbors'
  | 'Carpool Arrangement'
  | 'Sports & Recreation'
  | 'Children & Education'
  | 'Health & Wellness';

// Nigerian Neighborhood Types
export type NigerianNeighborhoodType = 
  | 'estate' // Gated residential estate
  | 'compound' // Family/communal compound
  | 'district' // Urban district/area
  | 'village' // Rural village
  | 'quarters' // Government/company quarters
  | 'layout' // Planned residential layout;

// Nigerian Safety Alert Types
export type NigerianSafetyAlertType =
  | 'Armed Robbery'
  | 'Burglary'
  | 'Vehicle Theft'
  | 'Suspicious Activity'
  | 'Fire Incident'
  | 'Flood Warning'
  | 'Road Accident'
  | 'Power Outage'
  | 'Water Shortage'
  | 'Gas Leak'
  | 'Medical Emergency'
  | 'Missing Person'
  | 'Domestic Violence'
  | 'Fraud Alert'
  | 'Kidnapping'
  | 'Traffic Congestion'
  | 'Environmental Hazard'
  | 'Animal Attack'
  | 'Infrastructure Damage'
  | 'Public Disturbance';

// Nigerian Time Zones
export interface NigerianTimeZone {
  name: 'West Africa Time';
  abbreviation: 'WAT';
  utc_offset: '+01:00';
  dst: false; // Nigeria doesn't observe daylight saving time
}

// Nigerian Payment Methods
export type NigerianPaymentMethod =
  | 'Paystack Card'
  | 'Paystack Bank Transfer'
  | 'Paystack USSD'
  | 'Paystack QR Code'
  | 'Flutterwave Card'
  | 'Flutterwave Bank Transfer'
  | 'Bank Transfer'
  | 'Cash on Delivery'
  | 'Mobile Money'
  | 'POS Payment';

// Nigerian Banks (Major ones)
export type NigerianBank =
  | 'Access Bank'
  | 'Zenith Bank'
  | 'GTBank'
  | 'First Bank'
  | 'UBA'
  | 'Ecobank'
  | 'Fidelity Bank'
  | 'Union Bank'
  | 'Sterling Bank'
  | 'Wema Bank'
  | 'FCMB'
  | 'Heritage Bank'
  | 'Keystone Bank'
  | 'Polaris Bank'
  | 'Stanbic IBTC'
  | 'Unity Bank'
  | 'Kuda Bank'
  | 'Opay'
  | 'PalmPay'
  | 'Carbon';

// Cultural Greetings by Language
export interface NigerianGreeting {
  language: NigerianLanguage;
  morning: string;
  afternoon: string;
  evening: string;
  general: string;
  native_name: string;
}

// Estate/Compound Amenities
export type EstateAmenity =
  | 'Security Gate'
  | '24/7 Security'
  | 'Swimming Pool'
  | 'Gym/Fitness Center'
  | 'Playground'
  | 'Basketball Court'
  | 'Tennis Court'
  | 'Football Field'
  | 'Community Hall'
  | 'Shopping Complex'
  | 'Medical Clinic'
  | 'School'
  | 'Restaurant'
  | 'Laundry Service'
  | 'Power Supply'
  | 'Water Supply'
  | 'Waste Management'
  | 'Parking Space'
  | 'Garden/Park'
  | 'CCTV Surveillance'
  | 'Fire Safety'
  | 'Backup Generator'
  | 'Internet/WiFi'
  | 'Cleaning Service'
  | 'Maintenance Service';

// Location Verification Methods
export type LocationVerificationMethod = 
  | 'gps' // GPS coordinates verification
  | 'referral' // Referral by existing resident
  | 'manual' // Manual verification by admin
  | 'document' // Document verification (utility bill, etc.)
  | 'visit' // Physical visit verification
  | 'phone' // Phone number area code verification;

// Trust Score Factors
export interface TrustScoreFactors {
  phone_verified: number;
  address_verified: number;
  document_verified: number;
  community_endorsements: number;
  transaction_history: number;
  time_in_community: number;
  positive_interactions: number;
  reported_incidents: number;
}

// Nigerian Cultural Context
export interface CulturalContext {
  respect_for_elders: boolean;
  community_first: boolean;
  religious_consideration: boolean;
  family_oriented: boolean;
  hospitality_focused: boolean;
  security_conscious: boolean;
  multi_generational: boolean;
}

// Nigerian Measurement Units (commonly used)
export interface NigerianMeasurements {
  distance: 'kilometers' | 'meters';
  area: 'square_meters' | 'plots' | 'acres';
  weight: 'kilograms' | 'grams';
  temperature: 'celsius';
  fuel: 'liters';
  time_format: '12-hour'; // 12-hour format is preferred
}

// Emergency Contacts Structure for Nigeria
export interface NigerianEmergencyContacts {
  police: '199' | '0803 123 4567'; // National or local
  fire_service: '199';
  ambulance: '199';
  emergency_line: '112';
  estate_security?: string;
  estate_management?: string;
  local_vigilante?: string;
  nearest_hospital?: string;
  community_leader?: string;
}