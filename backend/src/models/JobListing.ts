import mongoose, { Schema, Document } from 'mongoose';

export interface IJobListing extends Document {
  userId: string;
  userName: string;
  userPhone: string;
  userWhatsapp: string;
  title: string;
  description: string;
  category: 'hasat' | 'ekim' | 'bakim' | 'nakliye' | 'diger';
  workType: 'gunluk' | 'mevsimlik' | 'surekli' | 'parca-basi';
  peopleNeeded: number;
  salary: number;
  salaryUnit: 'gunluk' | 'saatlik' | 'aylik' | 'parca-basi';
  location: {
    city: string;
    district: string;
    address: string;
    coordinates: { lat: number; lng: number } | null;
  };
  startDate: Date;
  endDate: Date | null;
  requirements: string[];
  benefits: string[]; // yemek, lojman, ulaşım vs.
  images: string[];
  status: 'active' | 'filled' | 'expired' | 'cancelled';
  applicationCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const JobListingSchema = new Schema<IJobListing>({
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userPhone: { type: String, default: '' },
  userWhatsapp: { type: String, default: '' },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 3000 },
  category: {
    type: String,
    enum: ['hasat', 'ekim', 'bakim', 'nakliye', 'diger'],
    default: 'hasat',
  },
  workType: {
    type: String,
    enum: ['gunluk', 'mevsimlik', 'surekli', 'parca-basi'],
    default: 'gunluk',
  },
  peopleNeeded: { type: Number, default: 1 },
  salary: { type: Number, default: 0 },
  salaryUnit: {
    type: String,
    enum: ['gunluk', 'saatlik', 'aylik', 'parca-basi'],
    default: 'gunluk',
  },
  location: {
    city: { type: String, required: true },
    district: { type: String, default: '' },
    address: { type: String, default: '' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  requirements: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  images: { type: [String], default: [] },
  status: {
    type: String,
    enum: ['active', 'filled', 'expired', 'cancelled'],
    default: 'active',
  },
  applicationCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

JobListingSchema.index({ status: 1, createdAt: -1 });
JobListingSchema.index({ 'location.city': 1, status: 1 });
JobListingSchema.index({ category: 1, status: 1 });
JobListingSchema.index({ startDate: 1 });

export default mongoose.model<IJobListing>('JobListing', JobListingSchema);
