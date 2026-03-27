import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmPlot extends Document {
  plot_id: string;
  user_id: string;
  region_id: string;
  area_m2: number;
  crop_type: string;
  crop_display_name: string;
  // Field Status
  health_score: number;
  water_level: number;
  fertilizer_level: number;
  fire_rate: number;
  growth_stage: 'seed' | 'sprout' | 'growing' | 'flowering' | 'fruiting' | 'harvest_ready';
  growth_percent: number;
  // Dates
  seed_date: Date;
  estimated_harvest_date: Date;
  actual_harvest_date: Date | null;
  // Cost Tracking
  total_spent: number;
  rent_cost_monthly: number;
  next_rent_due: Date;
  // Status
  status: 'active' | 'harvesting' | 'completed' | 'abandoned' | 'paused';
  is_imece: boolean;
  imece_group_id: string;
  // Last Actions
  last_watered_at: Date | null;
  last_fertilized_at: Date | null;
  last_protected_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const FarmPlotSchema = new Schema<IFarmPlot>({
  plot_id: { type: String, required: true },
  user_id: { type: String, required: true },
  region_id: { type: String, required: true },
  area_m2: { type: Number, required: true },
  crop_type: { type: String, required: true },
  crop_display_name: { type: String, default: '' },
  // Field Status
  health_score: { type: Number, default: 100, min: 0, max: 100 },
  water_level: { type: Number, default: 100, min: 0, max: 100 },
  fertilizer_level: { type: Number, default: 100, min: 0, max: 100 },
  fire_rate: { type: Number, default: 0, min: 0, max: 100 },
  growth_stage: {
    type: String,
    enum: ['seed', 'sprout', 'growing', 'flowering', 'fruiting', 'harvest_ready'],
    default: 'seed',
  },
  growth_percent: { type: Number, default: 0, min: 0, max: 100 },
  // Dates
  seed_date: { type: Date, default: Date.now },
  estimated_harvest_date: { type: Date },
  actual_harvest_date: { type: Date, default: null },
  // Cost Tracking
  total_spent: { type: Number, default: 0 },
  rent_cost_monthly: { type: Number, default: 0 },
  next_rent_due: { type: Date },
  // Status
  status: {
    type: String,
    enum: ['active', 'harvesting', 'completed', 'abandoned', 'paused'],
    default: 'active',
  },
  is_imece: { type: Boolean, default: false },
  imece_group_id: { type: String, default: '' },
  // Last Actions
  last_watered_at: { type: Date, default: null },
  last_fertilized_at: { type: Date, default: null },
  last_protected_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

FarmPlotSchema.index({ plot_id: 1 }, { unique: true });
FarmPlotSchema.index({ user_id: 1, status: 1 });
FarmPlotSchema.index({ region_id: 1, status: 1 });
FarmPlotSchema.index({ status: 1, estimated_harvest_date: 1 });
FarmPlotSchema.index({ health_score: 1 });

export default mongoose.model<IFarmPlot>('FarmPlot', FarmPlotSchema);
