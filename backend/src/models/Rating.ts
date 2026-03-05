import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  fromUserId: string;
  toUserId: string;
  listingId?: string;
  score: number;
  comment: string;
  fromUserName: string;
  fromUserImage: string;
  seller_reply: string;
  isUpdated: boolean;
  commentDeleted: boolean;
  createdAt: Date;
}

const RatingSchema = new Schema<IRating>({
  fromUserId: { type: String, required: true },
  toUserId: { type: String, required: true },
  listingId: { type: String, default: '' },
  score: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  fromUserName: { type: String, default: '' },
  fromUserImage: { type: String, default: '' },
  seller_reply: { type: String, default: '' },
  isUpdated: { type: Boolean, default: false },
  commentDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

RatingSchema.index({ toUserId: 1 });
RatingSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export default mongoose.model<IRating>('Rating', RatingSchema);
