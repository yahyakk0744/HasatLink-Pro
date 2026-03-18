import mongoose, { Schema, Document } from 'mongoose';

export interface IListingView extends Document {
  listingId: string;
  identifier: string;
  createdAt: Date;
}

const ListingViewSchema = new Schema<IListingView>({
  listingId: { type: String, required: true },
  identifier: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

ListingViewSchema.index({ listingId: 1, identifier: 1 }, { unique: true });
ListingViewSchema.index({ listingId: 1, createdAt: -1 });

export default mongoose.model<IListingView>('ListingView', ListingViewSchema);
