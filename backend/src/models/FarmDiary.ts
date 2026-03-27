import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmDiary extends Document {
  diary_id: string;
  plot_id: string;
  region_id: string;
  type: 'photo' | 'video' | 'note';
  media_url: string;
  thumbnail_url: string;
  description: string;
  uploaded_by: string;
  uploader_name: string;
  week_number: number;
  season_year: string;
  likes_count: number;
  created_at: Date;
}

const FarmDiarySchema = new Schema<IFarmDiary>({
  diary_id: { type: String, required: true },
  plot_id: { type: String, default: '' },
  region_id: { type: String, required: true },
  type: { type: String, enum: ['photo', 'video', 'note'], required: true },
  media_url: { type: String, default: '' },
  thumbnail_url: { type: String, default: '' },
  description: { type: String, default: '' },
  uploaded_by: { type: String, required: true },
  uploader_name: { type: String, default: '' },
  week_number: { type: Number, default: 0 },
  season_year: { type: String, default: '' },
  likes_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

FarmDiarySchema.index({ region_id: 1, created_at: -1 });
FarmDiarySchema.index({ plot_id: 1, week_number: 1 });

export default mongoose.model<IFarmDiary>('FarmDiary', FarmDiarySchema);
