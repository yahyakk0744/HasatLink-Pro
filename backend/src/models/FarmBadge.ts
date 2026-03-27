import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmBadge extends Document {
  user_id: string;
  badge_type: string;
  badge_name: string;
  badge_icon: string;
  description: string;
  earned_at: Date;
}

const FarmBadgeSchema = new Schema<IFarmBadge>({
  user_id: { type: String, required: true },
  badge_type: { type: String, required: true },
  badge_name: { type: String, required: true },
  badge_icon: { type: String, default: '' },
  description: { type: String, default: '' },
  earned_at: { type: Date, default: Date.now },
});

FarmBadgeSchema.index({ user_id: 1, badge_type: 1 }, { unique: true });
FarmBadgeSchema.index({ user_id: 1 });

export default mongoose.model<IFarmBadge>('FarmBadge', FarmBadgeSchema);
