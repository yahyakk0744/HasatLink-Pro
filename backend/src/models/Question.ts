import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  body: string;
  category: string; // 'hastalik' | 'gubre' | 'sulama' | 'tohum' | 'genel' | ...
  tags: string[];
  images: string[];
  upvotes: string[]; // userId array
  answerCount: number;
  viewCount: number;
  isResolved: boolean;
  bestAnswerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 5000 },
  category: { type: String, default: 'genel', index: true },
  tags: { type: [String], default: [] },
  images: { type: [String], default: [] },
  upvotes: { type: [String], default: [] },
  answerCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  isResolved: { type: Boolean, default: false },
  bestAnswerId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

QuestionSchema.index({ category: 1, createdAt: -1 });
QuestionSchema.index({ isResolved: 1, createdAt: -1 });
QuestionSchema.index({ title: 'text', body: 'text', tags: 'text' });

export default mongoose.model<IQuestion>('Question', QuestionSchema);
