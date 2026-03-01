import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  listingId: string;
  userId: string;
  userName: string;
  userImage: string;
  text: string;
  parentId: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
  listingId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, default: '' },
  userImage: { type: String, default: '' },
  text: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  createdAt: { type: Date, default: Date.now },
});

CommentSchema.index({ listingId: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
