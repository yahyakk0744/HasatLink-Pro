import mongoose, { Schema, Document } from 'mongoose';

export interface ILogisticsProvider extends Document {
  name: string;
  companyName: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  district: string;
  vehicleTypes: string[]; // 'kamyon' | 'tir' | 'soguk-zincir' | 'frigo' | 'minibus'
  capacityKg: number;
  coverageAreas: string[]; // şehir listesi
  pricePerKm: number;
  hasColdChain: boolean;
  description: string;
  logoUrl: string;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  isActive: boolean;
  contactCount: number;
  createdAt: Date;
}

const LogisticsProviderSchema = new Schema<ILogisticsProvider>({
  name: { type: String, required: true },
  companyName: { type: String, default: '' },
  phone: { type: String, required: true },
  whatsapp: { type: String, default: '' },
  email: { type: String, default: '' },
  city: { type: String, required: true, index: true },
  district: { type: String, default: '' },
  vehicleTypes: { type: [String], default: [] },
  capacityKg: { type: Number, default: 0 },
  coverageAreas: { type: [String], default: [] },
  pricePerKm: { type: Number, default: 0 },
  hasColdChain: { type: Boolean, default: false },
  description: { type: String, default: '', maxlength: 1000 },
  logoUrl: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  contactCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

LogisticsProviderSchema.index({ city: 1, isActive: 1 });
LogisticsProviderSchema.index({ hasColdChain: 1, isActive: 1 });
LogisticsProviderSchema.index({ coverageAreas: 1 });

export default mongoose.model<ILogisticsProvider>('LogisticsProvider', LogisticsProviderSchema);
