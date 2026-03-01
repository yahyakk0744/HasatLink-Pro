import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true },
  type: { type: String, required: true, enum: ['borsa', 'istatistik', 'sistem', 'ilan', 'rating', 'hava', 'mesaj'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
