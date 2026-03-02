import mongoose, { Schema, Document } from 'mongoose';

export interface IListingShare extends Document {
  listingId: string;
  userId: string;
  createdAt: Date;
}

const ListingShareSchema = new Schema<IListingShare>({
  listingId: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

ListingShareSchema.index({ listingId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IListingShare>('ListingShare', ListingShareSchema);
