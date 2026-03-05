import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  listingId: string;
  listingTitle: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  offerPrice: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

const OfferSchema = new Schema<IOffer>({
  listingId: { type: String, required: true },
  listingTitle: { type: String, default: '' },
  fromUserId: { type: String, required: true },
  fromUserName: { type: String, default: '' },
  toUserId: { type: String, required: true },
  offerPrice: { type: Number, required: true },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

OfferSchema.index({ listingId: 1, fromUserId: 1 });
OfferSchema.index({ toUserId: 1, status: 1 });

export default mongoose.model<IOffer>('Offer', OfferSchema);
