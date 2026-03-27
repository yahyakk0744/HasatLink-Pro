import mongoose, { Schema, Document } from 'mongoose';

export interface IForecastDay {
  date: string;
  temp_min: number;
  temp_max: number;
  rain_chance: number;
  description: string;
}

export interface IFarmWeatherLog extends Document {
  region_id: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  rain_mm: number;
  description: string;
  icon: string;
  // Risk Assessment
  frost_risk: boolean;
  heat_risk: boolean;
  drought_risk: boolean;
  storm_risk: boolean;
  forecast_3day: IForecastDay[];
  fetched_at: Date;
}

const FarmWeatherLogSchema = new Schema<IFarmWeatherLog>({
  region_id: { type: String, required: true },
  temperature: { type: Number, default: 0 },
  feels_like: { type: Number, default: 0 },
  humidity: { type: Number, default: 0 },
  wind_speed: { type: Number, default: 0 },
  rain_mm: { type: Number, default: 0 },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  // Risk Assessment
  frost_risk: { type: Boolean, default: false },
  heat_risk: { type: Boolean, default: false },
  drought_risk: { type: Boolean, default: false },
  storm_risk: { type: Boolean, default: false },
  forecast_3day: [
    {
      date: { type: String, required: true },
      temp_min: { type: Number, required: true },
      temp_max: { type: Number, required: true },
      rain_chance: { type: Number, default: 0 },
      description: { type: String, default: '' },
    },
  ],
  fetched_at: { type: Date, default: Date.now },
});

FarmWeatherLogSchema.index({ region_id: 1, fetched_at: -1 });
FarmWeatherLogSchema.index({ fetched_at: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model<IFarmWeatherLog>('FarmWeatherLog', FarmWeatherLogSchema);
