import mongoose, { Schema, Document } from 'mongoose';

export interface IShippingAddress {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  district: string;
  postal_code: string;
}

export interface IImeceShare {
  user_id: string;
  share_kg: number;
  shipping_address: IShippingAddress;
  shipping_status: 'pending' | 'preparing' | 'shipped' | 'delivered';
  tracking_number: string;
}

export interface IFarmHarvest extends Document {
  harvest_id: string;
  plot_id: string;
  user_id: string;
  region_id: string;
  crop_type: string;
  // Yield
  base_yield_kg: number;
  health_multiplier: number;
  fire_multiplier: number;
  actual_yield_kg: number;
  quality_score: number;
  // Shipping
  shipping_address: IShippingAddress;
  shipping_status: 'pending' | 'preparing' | 'shipped' | 'delivered';
  tracking_number: string;
  shipping_cost: number;
  shipped_at: Date | null;
  delivered_at: Date | null;
  // Imece
  is_imece: boolean;
  imece_shares: IImeceShare[];
  created_at: Date;
}

const ShippingAddressSubSchema = {
  full_name: { type: String, default: '' },
  phone: { type: String, default: '' },
  address_line: { type: String, default: '' },
  city: { type: String, default: '' },
  district: { type: String, default: '' },
  postal_code: { type: String, default: '' },
};

const FarmHarvestSchema = new Schema<IFarmHarvest>({
  harvest_id: { type: String, required: true },
  plot_id: { type: String, required: true },
  user_id: { type: String, required: true },
  region_id: { type: String, required: true },
  crop_type: { type: String, required: true },
  // Yield
  base_yield_kg: { type: Number, default: 0 },
  health_multiplier: { type: Number, default: 1 },
  fire_multiplier: { type: Number, default: 1 },
  actual_yield_kg: { type: Number, default: 0 },
  quality_score: { type: Number, default: 0, min: 0, max: 100 },
  // Shipping
  shipping_address: ShippingAddressSubSchema,
  shipping_status: {
    type: String,
    enum: ['pending', 'preparing', 'shipped', 'delivered'],
    default: 'pending',
  },
  tracking_number: { type: String, default: '' },
  shipping_cost: { type: Number, default: 0 },
  shipped_at: { type: Date, default: null },
  delivered_at: { type: Date, default: null },
  // Imece
  is_imece: { type: Boolean, default: false },
  imece_shares: [
    {
      user_id: { type: String, required: true },
      share_kg: { type: Number, required: true },
      shipping_address: ShippingAddressSubSchema,
      shipping_status: {
        type: String,
        enum: ['pending', 'preparing', 'shipped', 'delivered'],
        default: 'pending',
      },
      tracking_number: { type: String, default: '' },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

FarmHarvestSchema.index({ harvest_id: 1 }, { unique: true });
FarmHarvestSchema.index({ user_id: 1 });
FarmHarvestSchema.index({ plot_id: 1 });
FarmHarvestSchema.index({ shipping_status: 1 });

export default mongoose.model<IFarmHarvest>('FarmHarvest', FarmHarvestSchema);
