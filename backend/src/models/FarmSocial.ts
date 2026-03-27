import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmSocial extends Document {
  visitor_id: string;
  plot_id: string;
  plot_owner_id: string;
  rating: number;
  comment: string;
  created_at: Date;
}

const FarmSocialSchema = new Schema<IFarmSocial>({
  visitor_id: { type: String, required: true },
  plot_id: { type: String, required: true },
  plot_owner_id: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 200 },
  created_at: { type: Date, default: Date.now },
});

FarmSocialSchema.index({ plot_id: 1, created_at: -1 });
FarmSocialSchema.index({ visitor_id: 1, plot_id: 1 }, { unique: true });

export default mongoose.model<IFarmSocial>('FarmSocial', FarmSocialSchema);
