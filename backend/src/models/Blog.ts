import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  published: boolean;
  createdAt: Date;
}

const blogSchema = new Schema<IBlog>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  coverImage: { type: String, default: '' },
  category: { type: String, default: 'genel' },
  author: { type: String, default: 'HasatLink' },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

blogSchema.index({ published: 1, createdAt: -1 });

export default mongoose.model<IBlog>('Blog', blogSchema);
