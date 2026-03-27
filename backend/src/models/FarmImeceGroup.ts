import mongoose, { Schema, Document } from 'mongoose';

export interface IImeceMember {
  user_id: string;
  name: string;
  share_percent: number;
  joined_at: Date;
  status: 'active' | 'left' | 'removed';
  total_paid: number;
}

export interface IFarmImeceGroup extends Document {
  group_id: string;
  plot_id: string;
  owner_id: string;
  members: IImeceMember[];
  invite_code: string;
  expense_split_type: 'equal' | 'proportional';
  max_members: number;
  status: 'active' | 'dissolved';
  created_at: Date;
}

const FarmImeceGroupSchema = new Schema<IFarmImeceGroup>({
  group_id: { type: String, required: true },
  plot_id: { type: String, required: true },
  owner_id: { type: String, required: true },
  members: [
    {
      user_id: { type: String, required: true },
      name: { type: String, default: '' },
      share_percent: { type: Number, required: true, min: 0, max: 100 },
      joined_at: { type: Date, default: Date.now },
      status: { type: String, enum: ['active', 'left', 'removed'], default: 'active' },
      total_paid: { type: Number, default: 0 },
    },
  ],
  invite_code: { type: String, required: true },
  expense_split_type: { type: String, enum: ['equal', 'proportional'], default: 'equal' },
  max_members: { type: Number, default: 5 },
  status: { type: String, enum: ['active', 'dissolved'], default: 'active' },
  created_at: { type: Date, default: Date.now },
});

FarmImeceGroupSchema.index({ group_id: 1 }, { unique: true });
FarmImeceGroupSchema.index({ plot_id: 1 });
FarmImeceGroupSchema.index({ invite_code: 1 });
FarmImeceGroupSchema.index({ 'members.user_id': 1 });

export default mongoose.model<IFarmImeceGroup>('FarmImeceGroup', FarmImeceGroupSchema);
