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
  isSuspended?: boolean;
  firebaseUid?: string;
  favorites?: string[];
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
}

export interface Listing {
  _id: string;
  userId: string;
  type: 'pazar' | 'lojistik' | 'isgucu' | 'ekipman' | 'arazi' | 'depolama';
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
  isFeatured?: boolean;
  // Stats
  stats: { views: number; whatsappClicks: number; shares: number };
  // Populated seller info
  sellerName: string;
  sellerImage: string;
  sellerRating: number;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'borsa' | 'istatistik' | 'sistem' | 'ilan' | 'rating' | 'hava' | 'mesaj';
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

export interface WeatherData {
  city: string;
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
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

export interface Ad {
  _id: string;
  slot: 'header' | 'sidebar' | 'footer' | 'between-listings';
  enabled: boolean;
  imageUrl: string;
  clickUrl: string;
  startDate: string;
  endDate: string;
  clickCount: number;
  impressionCount: number;
  createdAt: string;
}

