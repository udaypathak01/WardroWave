import mongoose from 'mongoose';
import { paiseField, safeIntegerField } from './schemaFields.js';

const inventoryUnitSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    unitCode: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['available', 'reserved', 'rented', 'cleaning', 'maintenance', 'retired'], default: 'available' },
    condition: { type: String, enum: ['new', 'excellent', 'good', 'fair'], default: 'new' },
    conditionNotes: String,
    rentCount: safeIntegerField({ defaultValue: 0 }),
    maxRentCount: safeIntegerField({ defaultValue: 30, min: 1 }),
    reservationLockVersion: safeIntegerField({ defaultValue: 0 }),
    lastCleanedAt: Date,
    cleaningUntil: Date,
    purchasedAt: Date,
    purchaseCost: paiseField(),
  },
  { timestamps: true, versionKey: false }
);

inventoryUnitSchema.index({ variant: 1, status: 1 });
inventoryUnitSchema.index({ product: 1, status: 1 });
inventoryUnitSchema.index({ status: 1, createdAt: -1 });
inventoryUnitSchema.index({ product: 1, status: 1, createdAt: -1 });
inventoryUnitSchema.index({ variant: 1, status: 1, createdAt: -1 });

export const InventoryUnit = mongoose.model('InventoryUnit', inventoryUnitSchema);
