import mongoose, { Schema, Document } from 'mongoose';

export interface ISponsoredContent extends Document {
  sponsorName: string;
  sponsorLogo: string;
  sponsorUrl: string;
  title: string;
  slug: string;
  summary: string;
  content: string; // HTML / markdown
  coverImage: string;
  videoUrl: string; // opsiyonel
  category: string; // 'gubre' | 'tohum' | 'ekipman' | 'sigorta' | ...
  tags: string[];
  published: boolean;
  startDate: Date;
  endDate: Date;
  impressionCount: number;
  clickCount: number;
  createdAt: Date;
}

const SponsoredContentSchema = new Schema<ISponsoredContent>({
  sponsorName: { type: String, required: true },
  sponsorLogo: { type: String, default: '' },
  sponsorUrl: { type: String, default: '' },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  summary: { type: String, default: '', maxlength: 500 },
  content: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  category: { type: String, default: 'genel', index: true },
  tags: { type: [String], default: [] },
  published: { type: Boolean, default: false },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  impressionCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

SponsoredContentSchema.index({ published: 1, startDate: 1, endDate: 1 });
SponsoredContentSchema.index({ category: 1, published: 1 });

export default mongoose.model<ISponsoredContent>('SponsoredContent', SponsoredContentSchema);
