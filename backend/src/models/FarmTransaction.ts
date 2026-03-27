import mongoose, { Schema, Document } from 'mongoose';

export interface IImeceSplit {
  user_id: string;
  amount: number;
  paid: boolean;
}

export interface IFarmTransaction extends Document {
  transaction_id: string;
  user_id: string;
  plot_id: string;
  group_id: string;
  type: 'rent' | 'seed' | 'water' | 'fertilizer' | 'frost_protection' | 'heat_protection' | 'shipping';
  amount: number;
  description: string;
  payment_method: 'wallet' | 'card';
  status: 'completed' | 'pending' | 'failed';
  imece_split: IImeceSplit[];
  created_at: Date;
}

const FarmTransactionSchema = new Schema<IFarmTransaction>({
  transaction_id: { type: String, required: true },
  user_id: { type: String, required: true },
  plot_id: { type: String, default: '' },
  group_id: { type: String, default: '' },
  type: {
    type: String,
    required: true,
    enum: ['rent', 'seed', 'water', 'fertilizer', 'frost_protection', 'heat_protection', 'shipping'],
  },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  payment_method: { type: String, enum: ['wallet', 'card'], default: 'wallet' },
  status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'pending' },
  imece_split: [
    {
      user_id: { type: String, required: true },
      amount: { type: Number, required: true },
      paid: { type: Boolean, default: false },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

FarmTransactionSchema.index({ transaction_id: 1 }, { unique: true });
FarmTransactionSchema.index({ user_id: 1, created_at: -1 });
FarmTransactionSchema.index({ plot_id: 1 });
FarmTransactionSchema.index({ type: 1 });

export default mongoose.model<IFarmTransaction>('FarmTransaction', FarmTransactionSchema);
