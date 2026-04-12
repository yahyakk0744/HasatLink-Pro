export interface User {
  _id?: string;
  userId: string;
  username: string;
  name: string;
  email: string;
  profileImage: string;
  location: string;
  phone: string;
  isVerified: boolean;
  language: string;
  role: string;
  averageRating: number;
  totalRatings: number;
  bio: string;
  isBanned: boolean;
  trust_score?: number;
  points?: number;
  isSuspended?: boolean;
  firebaseUid?: string;
  favorites?: string[];
  authProvider?: string;
  deletionScheduledAt?: string | null;
  createdAt: string;
}

export interface FirestoreParticipant {
  userId: string;
  name: string;
  profileImage: string;
}

export interface Conversation {
  id: string;
  participantUids: string[];
  participants: Record<string, FirestoreParticipant>;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  lastMessage: string;
  lastMessageAt: any;
  createdAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  read: boolean;
  delivered?: boolean;
}

export interface Listing {
  _id: string;
  userId: string;
  type: 'pazar' | 'lojistik' | 'isgucu' | 'ekipman' | 'arazi' | 'depolama' | 'hayvancilik';
  listingMode: 'sell' | 'buy';
  subCategory: string;
  status: string;
  title: string;
  description: string;
  price: number;
  amount: number;
  unit: string;
  location: string;
  coordinates: { lat: number; lng: number };
  images: string[];
  phone: string;
  // Pazar
  harvestDate: string;
  isOrganic: boolean;
  qualityGrade: string;
  storageType: string;
  minOrderAmount: number;
  // Lojistik
  isFrigo: boolean;
  vehicleType: string;
  capacity: number;
  routeFrom: string;
  routeTo: string;
  availableDate: string;
  hasInsurance: boolean;
  plateNumber: string;
  // İşgücü
  isTeam: boolean;
  workerCount: number;
  experienceYears: number;
  dailyWage: number;
  skills: string[];
  // Ekipman
  rentType: string;
  brand: string;
  modelName: string;
  yearOfManufacture: number;
  condition: string;
  horsePower: number;
  saleType: string;
  // Arazi
  landSize: number;
  landUnit: string;
  soilType: string;
  waterAvailable: boolean;
  hasElectricity: boolean;
  deedStatus: string;
  zoningStatus: string;
  rentDuration: string;
  // Depolama
  storageCapacity: number;
  storageCapacityUnit: string;
  temperatureMin: number;
  temperatureMax: number;
  hasSecurity: boolean;
  has24Access: boolean;
  // Hayvancılık
  animalBreed?: string;
  animalAge?: number;
  animalAgeUnit?: string;
  animalGender?: string;
  animalCount?: number;
  healthDocs?: string[];
  earTagNumber?: string;
  isVaccinated?: boolean;
  weight?: number;
  isFeatured?: boolean;
  is_negotiable?: boolean;
  needsTransport?: boolean;
  hasTransportCapacity?: boolean;
  // Media & docs
  videoUrl?: string;
  documents?: { name: string; url: string }[];
  previousPrice?: number;
  updatedAt?: string;
  // Stats
  stats: { views: number; whatsappClicks: number; shares: number };
  // Populated seller info
  sellerName: string;
  sellerImage: string;
  sellerRating: number;
  sellerTotalRatings?: number;
  sellerVerified?: boolean;
  sellerTrustScore?: number;
  sellerPoints?: number;
  sellerListingCount?: number;
  sellerJoinDate?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'borsa' | 'istatistik' | 'sistem' | 'ilan' | 'rating' | 'hava' | 'mesaj' | 'teklif';
  title: string;
  message: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

export interface MarketPrice {
  _id: string;
  name: string;
  nameEn: string;
  price: number;
  previousPrice: number;
  change: number;
  unit: string;
  category: string;
  updatedAt: string;
}

export interface Rating {
  _id: string;
  fromUserId: string;
  toUserId: string;
  listingId?: string;
  score: number;
  comment: string;
  fromUserName: string;
  fromUserImage: string;
  seller_reply?: string;
  isUpdated?: boolean;
  commentDeleted?: boolean;
  createdAt: string;
}

export interface Comment {
  _id: string;
  listingId: string;
  userId: string;
  userName: string;
  userImage: string;
  text: string;
  parentId: string | null;
  createdAt: string;
}

export interface HarvestPrediction {
  estimated_days: number;
  quality_score: number;
  quality_label: string;
  quality_factors: string[];
  optimal_conditions: string;
}

export interface RegionalAlert {
  disease: string;
  crop_type: string;
  risk_level: string;
  message: string;
}

export interface DiseaseLibraryItem {
  disease: string;
  disease_code: string;
  crop_type: string;
  urgency: 'low' | 'medium' | 'critical';
  spread_risk: 'low' | 'medium' | 'high';
  treatment: string;
  recommended_products: string[];
  prevention: string;
  is_seasonal: boolean;
  active_regions: string[];
}

export interface HFClassification {
  label: string;
  label_tr: string;
  score: number;
}

export interface AIDiagnosisResult {
  disease: string;
  disease_code: string;
  confidence: number;
  treatment: string;
  stage: 'early' | 'mid' | 'advanced';
  spread_risk: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'critical';
  crop_type: string;
  detected_crop?: string;
  image_url?: string;
  needs_better_photo: boolean;
  warning: string | null;
  recommended_products?: string[];
  prevention?: string;
  seasonal_alert?: boolean;
  regional_alerts?: RegionalAlert[];
  harvest_prediction?: HarvestPrediction;
  ai_engine?: 'gemini' | 'huggingface' | 'local';
  gemini_analysis?: string;
  hf_top3?: HFClassification[];
  // World-class fields
  immediate_action?: string;
  economic_impact?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  economic_loss_estimate?: number;
  treatment_schedule?: { day: number; action: string }[];
  differential_diagnosis?: string[];
  weather_triggers?: string;
  lab_confirmation?: boolean;
  growth_stage_pct?: number;
}

export interface AIDiagnosisHistory extends AIDiagnosisResult {
  _id: string;
  userId: string;
  createdAt: string;
}

export interface Dealer {
  _id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  coordinates: { lat: number; lng: number };
  profileImage: string;
  coverImage: string;
  description: string;
  specialization_tags: string[];
  ad_status: 'active' | 'pending' | 'rejected' | 'expired';
  is_premium_partner: boolean;
  start_date: string;
  end_date: string;
  is_active: boolean;
  commission_rate: number;
  website: string;
  google_maps_url: string;
  target_regions: string[];
  impressionCount: number;
  clickCount: number;
  contactCount: number;
  createdAt: string;
}

export interface NearbyDealerItem {
  dealer: Dealer;
  distance: number;
  matchScore?: number;
}

export interface DealersResponse {
  dealers: NearbyDealerItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface WeatherAlert {
  type: 'frost' | 'heat' | 'storm' | 'humidity';
  message: string;
}

export interface WeatherData {
  city: string;
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  alerts?: WeatherAlert[];
}

export interface UserStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalWhatsapp: number;
  totalShares: number;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

export interface HalPrice extends MarketPrice {
  minPrice: number;
  maxPrice: number;
  malTipi: string;
}

export interface WeeklyPriceDay {
  date: string;
  prices: { name: string; min: number; max: number; avg: number }[];
}

export interface HasatlinkPazarItem {
  name: string;
  category: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  change: number;
  unit: string;
  listingCount: number;
  updatedAt: string;
}

export interface HasatlinkHourlyData {
  hour: string;
  prices: { name: string; min: number; max: number; avg: number }[];
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  published: boolean;
  createdAt: string;
}

export interface PremiumPackage {
  _id?: string;
  name: string;
  price: number;
  durationDays: number;
  features: string[];
}

export interface SiteSettings {
  _id?: string;
  key: string;
  siteTitle: string;
  siteDescription: string;
  logoUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  featuredListing: { enabled: boolean; pricePerListing: number; durationOptions: number[] };
  premiumMembership: { enabled: boolean; packages: PremiumPackage[] };
  commission: { enabled: boolean; percentage: number };
  aiUsageLimit: { enabled: boolean; dailyFreeCount: number };
  maintenanceMode?: boolean;
}

export interface PriceAlert {
  _id: string;
  userId: string;
  category: string;
  subCategory: string;
  targetPrice: number;
  keyword: string;
  condition?: 'below' | 'above';
  isActive: boolean;
  createdAt: string;
}

export interface Ad {
  _id: string;
  slot: 'header' | 'sidebar' | 'footer' | 'between-listings';
  enabled: boolean;
  imageUrl: string;
  mobileImageUrl?: string;
  clickUrl: string;
  startDate: string;
  endDate: string;
  clickCount: number;
  impressionCount: number;
  createdAt: string;
}

export interface Offer {
  _id: string;
  listingId: string;
  listingTitle: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  offerPrice: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

