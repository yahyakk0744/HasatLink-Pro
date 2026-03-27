import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmAction extends Document {
  plot_id: string;
  user_id: string;
  action_type: 'water' | 'fertilize' | 'protect_frost' | 'protect_heat';
  cost: number;
  health_impact: number;
  water_impact: number;
  fertilizer_impact: number;
  auto_triggered: boolean;
  created_at: Date;
}

const FarmActionSchema = new Schema<IFarmAction>({
  plot_id: { type: String, required: true },
  user_id: { type: String, required: true },
  action_type: {
    type: String,
    enum: ['water', 'fertilize', 'protect_frost', 'protect_heat'],
    required: true,
  },
  cost: { type: Number, default: 0 },
  health_impact: { type: Number, default: 0 },
  water_impact: { type: Number, default: 0 },
  fertilizer_impact: { type: Number, default: 0 },
  auto_triggered: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

FarmActionSchema.index({ plot_id: 1, created_at: -1 });
FarmActionSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model<IFarmAction>('FarmAction', FarmActionSchema);
