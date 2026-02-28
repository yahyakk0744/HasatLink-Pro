import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  username: string;
  name: string;
  email: string;
  password: string;
  profileImage: string;
  location: string;
  phone: string;
  isVerified: boolean;
  language: string;
  role: string;
  averageRating: number;
  totalRatings: number;
  bio: string;
  authProvider: string;
  firebaseUid: string;
  resetPasswordToken: string;
  resetPasswordExpires: Date | null;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, default: '', sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  language: { type: String, default: 'tr', enum: ['tr', 'en'] },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  authProvider: { type: String, default: 'email', enum: ['email', 'google'] },
  firebaseUid: { type: String, default: '', sparse: true },
  resetPasswordToken: { type: String, default: '' },
  resetPasswordExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
