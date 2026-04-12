import mongoose, { Schema, Document } from 'mongoose';

export interface IHarvestCalendar extends Document {
  product: string; // 'domates' | 'bugday' | 'findik' | ...
  productEn: string;
  category: string;
  plantMonths: number[]; // [3,4,5] = Mart-Nisan-Mayıs
  harvestMonths: number[];
  regions: string[]; // 'Akdeniz' | 'Ege' | 'Marmara' | ...
  description: string;
  tips: string[];
  iconUrl: string;
  coverImage: string;
  createdAt: Date;
  updatedAt: Date;
}

const HarvestCalendarSchema = new Schema<IHarvestCalendar>({
  product: { type: String, required: true, unique: true, index: true },
  productEn: { type: String, default: '' },
  category: { type: String, default: 'sebze', index: true },
  plantMonths: { type: [Number], default: [] },
  harvestMonths: { type: [Number], default: [] },
  regions: { type: [String], default: [] },
  description: { type: String, default: '', maxlength: 2000 },
  tips: { type: [String], default: [] },
  iconUrl: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

HarvestCalendarSchema.index({ harvestMonths: 1 });
HarvestCalendarSchema.index({ category: 1, product: 1 });

export default mongoose.model<IHarvestCalendar>('HarvestCalendar', HarvestCalendarSchema);
