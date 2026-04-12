import mongoose, { Schema, Document } from 'mongoose';

export interface IWeatherAlert extends Document {
  userId: string;
  city: string;
  district: string;
  alertType: 'frost' | 'hail' | 'heavy-rain' | 'storm' | 'heatwave' | 'drought';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  validFrom: Date;
  validUntil: Date;
  isRead: boolean;
  sentAt: Date;
  createdAt: Date;
}

const WeatherAlertSchema = new Schema<IWeatherAlert>({
  userId: { type: String, required: true, index: true },
  city: { type: String, required: true },
  district: { type: String, default: '' },
  alertType: {
    type: String,
    enum: ['frost', 'hail', 'heavy-rain', 'storm', 'heatwave', 'drought'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  message: { type: String, required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  isRead: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

WeatherAlertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
WeatherAlertSchema.index({ city: 1, alertType: 1, validUntil: 1 });

export default mongoose.model<IWeatherAlert>('WeatherAlert', WeatherAlertSchema);
