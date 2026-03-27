import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmWaitlist extends Document {
  user_id: string;
  region_id: string;
  requested_area_m2: number;
  crop_type: string;
  notify_email: boolean;
  notify_push: boolean;
  status: 'waiting' | 'notified' | 'converted';
  created_at: Date;
}

const FarmWaitlistSchema = new Schema<IFarmWaitlist>({
  user_id: { type: String, required: true },
  region_id: { type: String, required: true },
  requested_area_m2: { type: Number, required: true },
  crop_type: { type: String, default: '' },
  notify_email: { type: Boolean, default: true },
  notify_push: { type: Boolean, default: true },
  status: { type: String, enum: ['waiting', 'notified', 'converted'], default: 'waiting' },
  created_at: { type: Date, default: Date.now },
});

FarmWaitlistSchema.index({ region_id: 1, status: 1 });
FarmWaitlistSchema.index({ user_id: 1 });

export default mongoose.model<IFarmWaitlist>('FarmWaitlist', FarmWaitlistSchema);
