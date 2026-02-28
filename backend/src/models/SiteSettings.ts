import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  key: string;
  instagramUrl: string;
  twitterUrl: string;
}

const SiteSettingsSchema = new Schema<ISiteSettings>({
  key: { type: String, default: 'main', unique: true },
  instagramUrl: { type: String, default: '' },
  twitterUrl: { type: String, default: '' },
});

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
