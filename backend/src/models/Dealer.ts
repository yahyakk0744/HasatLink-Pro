import mongoose, { Schema, Document } from 'mongoose';

export interface IDealer extends Document {
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
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  commission_rate: number;
  website: string;
  google_maps_url: string;
  target_regions: string[];
  impressionCount: number;
  clickCount: number;
  contactCount: number;
  createdAt: Date;
}

const DealerSchema = new Schema<IDealer>({
  name: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: { type: String, default: '' },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  profileImage: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  description: { type: String, default: '' },
  specialization_tags: [{ type: String }],
  ad_status: {
    type: String,
    enum: ['active', 'pending', 'rejected', 'expired'],
    default: 'pending',
  },
  is_premium_partner: { type: Boolean, default: false },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  is_active: { type: Boolean, default: false },
  commission_rate: { type: Number, default: 0 },
  website: { type: String, default: '' },
  google_maps_url: { type: String, default: '' },
  target_regions: [{ type: String }],
  impressionCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  contactCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

DealerSchema.index({ coordinates: '2dsphere' });
DealerSchema.index({ ad_status: 1, is_active: 1, is_premium_partner: 1 });
DealerSchema.index({ specialization_tags: 1 });
DealerSchema.index({ end_date: 1 });
DealerSchema.index({ target_regions: 1 });

export default mongoose.model<IDealer>('Dealer', DealerSchema);
