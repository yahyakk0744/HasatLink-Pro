import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  fromUserId: string;
  toUserId: string;
  listingId: string;
  score: number;
  comment: string;
  fromUserName: string;
  fromUserImage: string;
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
  createdAt: { type: Date, default: Date.now },
});

RatingSchema.index({ toUserId: 1 });

export default mongoose.model<IRating>('Rating', RatingSchema);
