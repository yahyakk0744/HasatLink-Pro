import mongoose, { Schema, Document } from 'mongoose';

export interface IPremiumPackage {
  name: string;
  price: number;
  durationDays: number;
  features: string[];
}

export interface ISiteSettings extends Document {
  key: string;
  siteTitle: string;
  siteDescription: string;
  logoUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;

  // Monetizasyon toggle'ları (admin aktif edene kadar kapalı)
  featuredListing: { enabled: boolean; pricePerListing: number; durationOptions: number[] };
  bannerAds: { enabled: boolean };
  dealerDirectory: { enabled: boolean; monthlyPrice: number };
  sponsoredContent: { enabled: boolean };
  premiumMembership: { enabled: boolean; packages: IPremiumPackage[] };
  jobListings: { enabled: boolean; pricePerListing: number };
  reportsSale: { enabled: boolean; pricePerReport: number };
  commission: { enabled: boolean; percentage: number };

  // Özellik toggle'ları (komünite / bilgi)
  qnaForum: { enabled: boolean };
  weatherAlerts: { enabled: boolean };
  harvestCalendar: { enabled: boolean };
  successStories: { enabled: boolean };
  referralProgram: { enabled: boolean; rewardPoints: number };
  voiceMessages: { enabled: boolean };
  videoCall: { enabled: boolean };
  broadcastMessages: { enabled: boolean; dailyLimit: number };
  mapView: { enabled: boolean };
  voiceSearch: { enabled: boolean };
  logisticsDirectory: { enabled: boolean };
  weeklyNewsletter: { enabled: boolean };
  telegramBot: { enabled: boolean; botUsername: string };
  priceForecast: { enabled: boolean };

  // Sistem
  aiUsageLimit: { enabled: boolean; dailyFreeCount: number };
  maintenanceMode: boolean;
}

const PremiumPackageSchema = new Schema<IPremiumPackage>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  durationDays: { type: Number, required: true },
  features: [{ type: String }],
}, { _id: true });

const SiteSettingsSchema = new Schema<ISiteSettings>({
  key: { type: String, default: 'main', unique: true },
  siteTitle: { type: String, default: 'HasatLink' },
  siteDescription: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  facebookUrl: { type: String, default: '' },
  instagramUrl: { type: String, default: '' },
  twitterUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },

  // Monetizasyon
  featuredListing: {
    enabled: { type: Boolean, default: false },
    pricePerListing: { type: Number, default: 0 },
    durationOptions: { type: [Number], default: [7, 14, 30] },
  },
  bannerAds: {
    enabled: { type: Boolean, default: false },
  },
  dealerDirectory: {
    enabled: { type: Boolean, default: false },
    monthlyPrice: { type: Number, default: 0 },
  },
  sponsoredContent: {
    enabled: { type: Boolean, default: false },
  },
  premiumMembership: {
    enabled: { type: Boolean, default: false },
    packages: { type: [PremiumPackageSchema], default: [] },
  },
  jobListings: {
    enabled: { type: Boolean, default: false },
    pricePerListing: { type: Number, default: 0 },
  },
  reportsSale: {
    enabled: { type: Boolean, default: false },
    pricePerReport: { type: Number, default: 0 },
  },
  commission: {
    enabled: { type: Boolean, default: false },
    percentage: { type: Number, default: 0 },
  },

  // Özellikler
  qnaForum: {
    enabled: { type: Boolean, default: false },
  },
  weatherAlerts: {
    enabled: { type: Boolean, default: false },
  },
  harvestCalendar: {
    enabled: { type: Boolean, default: false },
  },
  successStories: {
    enabled: { type: Boolean, default: false },
  },
  referralProgram: {
    enabled: { type: Boolean, default: false },
    rewardPoints: { type: Number, default: 100 },
  },
  voiceMessages: {
    enabled: { type: Boolean, default: false },
  },
  videoCall: {
    enabled: { type: Boolean, default: false },
  },
  broadcastMessages: {
    enabled: { type: Boolean, default: false },
    dailyLimit: { type: Number, default: 1 },
  },
  mapView: {
    enabled: { type: Boolean, default: false },
  },
  voiceSearch: {
    enabled: { type: Boolean, default: false },
  },
  logisticsDirectory: {
    enabled: { type: Boolean, default: false },
  },
  weeklyNewsletter: {
    enabled: { type: Boolean, default: false },
  },
  telegramBot: {
    enabled: { type: Boolean, default: false },
    botUsername: { type: String, default: '' },
  },
  priceForecast: {
    enabled: { type: Boolean, default: false },
  },

  aiUsageLimit: {
    enabled: { type: Boolean, default: false },
    dailyFreeCount: { type: Number, default: 3 },
  },
  maintenanceMode: { type: Boolean, default: false },
});

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
