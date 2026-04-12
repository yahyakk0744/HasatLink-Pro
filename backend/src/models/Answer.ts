import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
  questionId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isExpert: boolean; // Uzman (ziraat mühendisi vs.)
  body: string;
  images: string[];
  upvotes: string[];
  isBestAnswer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>({
  questionId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  isExpert: { type: Boolean, default: false },
  body: { type: String, required: true, maxlength: 5000 },
  images: { type: [String], default: [] },
  upvotes: { type: [String], default: [] },
  isBestAnswer: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

AnswerSchema.index({ questionId: 1, createdAt: 1 });
AnswerSchema.index({ questionId: 1, isBestAnswer: -1, upvotes: -1 });

export default mongoose.model<IAnswer>('Answer', AnswerSchema);
