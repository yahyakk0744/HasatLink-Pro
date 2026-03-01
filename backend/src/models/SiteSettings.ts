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
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  featuredListing: { enabled: boolean; pricePerListing: number; durationOptions: number[] };
  premiumMembership: { enabled: boolean; packages: IPremiumPackage[] };
  commission: { enabled: boolean; percentage: number };
  aiUsageLimit: { enabled: boolean; dailyFreeCount: number };
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
  instagramUrl: { type: String, default: '' },
  twitterUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },
  featuredListing: {
    enabled: { type: Boolean, default: false },
    pricePerListing: { type: Number, default: 0 },
    durationOptions: [{ type: Number }],
  },
  premiumMembership: {
    enabled: { type: Boolean, default: false },
    packages: [PremiumPackageSchema],
  },
  commission: {
    enabled: { type: Boolean, default: false },
    percentage: { type: Number, default: 0 },
  },
  aiUsageLimit: {
    enabled: { type: Boolean, default: false },
    dailyFreeCount: { type: Number, default: 3 },
  },
});

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
