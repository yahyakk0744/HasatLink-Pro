import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  referrerId: string; // davet eden
  refereeId: string; // davet edilen (register sonrası)
  refereeEmail: string;
  referralCode: string;
  status: 'pending' | 'registered' | 'verified' | 'rewarded';
  rewardPoints: number;
  createdAt: Date;
  completedAt: Date | null;
}

const ReferralSchema = new Schema<IReferral>({
  referrerId: { type: String, required: true, index: true },
  refereeId: { type: String, default: '' },
  refereeEmail: { type: String, default: '' },
  referralCode: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'registered', 'verified', 'rewarded'],
    default: 'pending',
  },
  rewardPoints: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ referralCode: 1 });

export default mongoose.model<IReferral>('Referral', ReferralSchema);
