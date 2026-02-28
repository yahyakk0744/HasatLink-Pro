export interface User {
  _id?: string;
  userId: string;
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
  firebaseUid?: string;
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
  // Stats
  stats: { views: number; whatsappClicks: number; shares: number };
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'borsa' | 'istatistik' | 'sistem' | 'ilan' | 'rating' | 'hava';
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
  listingId: string;
  score: number;
  comment: string;
  fromUserName: string;
  fromUserImage: string;
  createdAt: string;
}

export interface AIDiagnosisResult {
  disease: string;
  confidence: number;
  treatment: string;
}

export interface AIDiagnosisHistory extends AIDiagnosisResult {
  _id: string;
  userId: string;
  createdAt: string;
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
  instagramUrl: string;
  twitterUrl: string;
  featuredListing: { enabled: boolean; pricePerListing: number; durationOptions: number[] };
  premiumMembership: { enabled: boolean; packages: PremiumPackage[] };
  commission: { enabled: boolean; percentage: number };
  aiUsageLimit: { enabled: boolean; dailyFreeCount: number };
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

