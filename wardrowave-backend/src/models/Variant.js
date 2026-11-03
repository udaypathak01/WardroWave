import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, unique: true, trim: true },
    size: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

variantSchema.index({ product: 1, size: 1, color: 1 }, { unique: true });
variantSchema.index({ product: 1, isActive: 1, size: 1 });

export const Variant = mongoose.model('Variant', variantSchema);
