import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
  userId: string;
  type: string;
  listingMode: 'sell' | 'buy';
  subCategory: string;
  status: string;
  title: string;
  description: string;
  price: number;
  amount: number;
  unit: string;
  location: string;
  coordinates: { lat: number; lng: number };
  images: string[];
  phone: string;
  // Pazar
  harvestDate: string;
  isOrganic: boolean;
  qualityGrade: string;
  storageType: string;
  minOrderAmount: number;
  // Lojistik
  isFrigo: boolean;
  vehicleType: string;
  capacity: number;
  routeFrom: string;
  routeTo: string;
  availableDate: string;
  hasInsurance: boolean;
  plateNumber: string;
  // İşgücü
  isTeam: boolean;
  workerCount: number;
  experienceYears: number;
  dailyWage: number;
  skills: string[];
  // Ekipman
  rentType: string;
  brand: string;
  modelName: string;
  yearOfManufacture: number;
  condition: string;
  horsePower: number;
  saleType: string;
  // Arazi
  landSize: number;
  landUnit: string;
  soilType: string;
  waterAvailable: boolean;
  hasElectricity: boolean;
  deedStatus: string;
  zoningStatus: string;
  rentDuration: string;
  // Depolama
  storageCapacity: number;
  storageCapacityUnit: string;
  temperatureMin: number;
  temperatureMax: number;
  hasSecurity: boolean;
  has24Access: boolean;
  // Stats
  stats: { views: number; whatsappClicks: number; shares: number };
  createdAt: Date;
}

const ListingSchema = new Schema<IListing>({
  userId: { type: String, required: true },
  type: { type: String, required: true, enum: ['pazar', 'lojistik', 'isgucu', 'ekipman', 'arazi', 'depolama'] },
  listingMode: { type: String, enum: ['sell', 'buy'], default: 'sell' },
  subCategory: { type: String, default: '' },
  status: { type: String, default: 'active', enum: ['active', 'sold', 'rented', 'closed'] },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  unit: { type: String, default: 'kg' },
  location: { type: String, default: 'Ceyhan, Adana' },
  coordinates: {
    lat: { type: Number, default: 37.0247 },
    lng: { type: Number, default: 35.8176 },
  },
  images: [{ type: String }],
  phone: { type: String, default: '' },
  // Pazar
  harvestDate: { type: String, default: '' },
  isOrganic: { type: Boolean, default: false },
  qualityGrade: { type: String, default: '' },
  storageType: { type: String, default: '' },
  minOrderAmount: { type: Number, default: 0 },
  // Lojistik
  isFrigo: { type: Boolean, default: false },
  vehicleType: { type: String, default: '' },
  capacity: { type: Number, default: 0 },
  routeFrom: { type: String, default: '' },
  routeTo: { type: String, default: '' },
  availableDate: { type: String, default: '' },
  hasInsurance: { type: Boolean, default: false },
  plateNumber: { type: String, default: '' },
  // İşgücü
  isTeam: { type: Boolean, default: false },
  workerCount: { type: Number, default: 1 },
  experienceYears: { type: Number, default: 0 },
  dailyWage: { type: Number, default: 0 },
  skills: [{ type: String }],
  // Ekipman
  rentType: { type: String, default: '' },
  brand: { type: String, default: '' },
  modelName: { type: String, default: '' },
  yearOfManufacture: { type: Number, default: 0 },
  condition: { type: String, default: '' },
  horsePower: { type: Number, default: 0 },
  saleType: { type: String, default: '' },
  // Arazi
  landSize: { type: Number, default: 0 },
  landUnit: { type: String, default: 'dönüm' },
  soilType: { type: String, default: '' },
  waterAvailable: { type: Boolean, default: false },
  hasElectricity: { type: Boolean, default: false },
  deedStatus: { type: String, default: '' },
  zoningStatus: { type: String, default: '' },
  rentDuration: { type: String, default: '' },
  // Depolama
  storageCapacity: { type: Number, default: 0 },
  storageCapacityUnit: { type: String, default: 'ton' },
  temperatureMin: { type: Number, default: 0 },
  temperatureMax: { type: Number, default: 0 },
  hasSecurity: { type: Boolean, default: false },
  has24Access: { type: Boolean, default: false },
  // Stats
  stats: {
    views: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

ListingSchema.index({ type: 1, listingMode: 1, status: 1 });
ListingSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IListing>('Listing', ListingSchema);
