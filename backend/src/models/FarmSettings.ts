import mongoose, { Schema, Document } from 'mongoose';

export interface IActiveCity {
  city_code: string;
  city_name: string;
  activated_at: Date;
  max_regions: number;
}

export interface ICropCatalogItem {
  crop_type: string;
  display_name: string;
  seed_cost_per_m2: number;
  min_area_m2: number;
  growth_days: number;
  yield_per_m2_kg: number;
  season_start_month: number;
  season_end_month: number;
  water_frequency_hours: number;
  fertilize_frequency_days: number;
  icon_emoji: string;
}

export interface IFarmSettings extends Document {
  key: string;
  enabled: boolean;
  beta_mode: boolean;
  whitelist_user_ids: string[];
  active_cities: IActiveCity[];
  fomo_thresholds: {
    amber_percent: number;
    red_percent: number;
    zero_waitlist: boolean;
  };
  pricing: {
    rent_per_m2_monthly: number;
    water_per_action: number;
    fertilizer_per_action: number;
    frost_protection_cost: number;
    heat_protection_cost: number;
    shipping_per_kg: number;
  };
  crop_catalog: ICropCatalogItem[];
  updated_at: Date;
  updated_by: string;
}

const FarmSettingsSchema = new Schema<IFarmSettings>({
  key: { type: String, required: true, default: 'digital_farm' },
  enabled: { type: Boolean, default: false },
  beta_mode: { type: Boolean, default: true },
  whitelist_user_ids: [{ type: String }],
  active_cities: [
    {
      city_code: { type: String, required: true },
      city_name: { type: String, required: true },
      activated_at: { type: Date, default: Date.now },
      max_regions: { type: Number, default: 10 },
    },
  ],
  fomo_thresholds: {
    amber_percent: { type: Number, default: 20 },
    red_percent: { type: Number, default: 10 },
    zero_waitlist: { type: Boolean, default: true },
  },
  pricing: {
    rent_per_m2_monthly: { type: Number, default: 5.0 },
    water_per_action: { type: Number, default: 2.5 },
    fertilizer_per_action: { type: Number, default: 8.0 },
    frost_protection_cost: { type: Number, default: 15.0 },
    heat_protection_cost: { type: Number, default: 10.0 },
    shipping_per_kg: { type: Number, default: 12.0 },
  },
  crop_catalog: [
    {
      crop_type: { type: String, required: true },
      display_name: { type: String, required: true },
      seed_cost_per_m2: { type: Number, required: true },
      min_area_m2: { type: Number, required: true },
      growth_days: { type: Number, required: true },
      yield_per_m2_kg: { type: Number, required: true },
      season_start_month: { type: Number, min: 1, max: 12, required: true },
      season_end_month: { type: Number, min: 1, max: 12, required: true },
      water_frequency_hours: { type: Number, required: true },
      fertilize_frequency_days: { type: Number, required: true },
      icon_emoji: { type: String, default: '' },
    },
  ],
  updated_at: { type: Date, default: Date.now },
  updated_by: { type: String, default: '' },
});

FarmSettingsSchema.index({ key: 1 }, { unique: true });

export default mongoose.model<IFarmSettings>('FarmSettings', FarmSettingsSchema);
