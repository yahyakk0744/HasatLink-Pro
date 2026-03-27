import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmRegion extends Document {
  region_id: string;
  region_name: string;
  city_code: string;
  city_name: string;
  district: string;
  coordinates: { lat: number; lng: number };
  total_area_m2: number;
  rented_area_m2: number;
  available_area_m2: number;
  available_percent: number;
  crop_types: string[];
  weather_station_id: string;
  soil_type: string;
  water_source: string;
  photos: string[];
  description: string;
  is_active: boolean;
  waitlist_count: number;
  created_at: Date;
  updated_at: Date;
}

const FarmRegionSchema = new Schema<IFarmRegion>({
  region_id: { type: String, required: true },
  region_name: { type: String, required: true },
  city_code: { type: String, required: true },
  city_name: { type: String, required: true },
  district: { type: String, default: '' },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  total_area_m2: { type: Number, required: true },
  rented_area_m2: { type: Number, default: 0 },
  available_area_m2: { type: Number, default: 0 },
  available_percent: { type: Number, default: 100 },
  crop_types: [{ type: String }],
  weather_station_id: { type: String, default: '' },
  soil_type: { type: String, default: '' },
  water_source: { type: String, default: '' },
  photos: [{ type: String }],
  description: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  waitlist_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

FarmRegionSchema.index({ region_id: 1 }, { unique: true });
FarmRegionSchema.index({ city_code: 1, is_active: 1 });
FarmRegionSchema.index({ available_percent: 1 });

export default mongoose.model<IFarmRegion>('FarmRegion', FarmRegionSchema);
