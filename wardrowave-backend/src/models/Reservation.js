import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryUnit', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rentalStart: { type: Date, required: true },
    rentalEnd: { type: Date, required: true },
    blockStart: { type: Date, required: true },
    blockEnd: { type: Date, required: true },
    status: { type: String, enum: ['held', 'confirmed', 'active', 'completed', 'cancelled', 'expired'], default: 'held' },
    holdExpiresAt: Date,
  },
  { timestamps: true, versionKey: false }
);

reservationSchema.index({ unit: 1, blockStart: 1, blockEnd: 1, status: 1 });
reservationSchema.index({ variant: 1, status: 1, blockStart: 1, blockEnd: 1 });
reservationSchema.index({ status: 1, holdExpiresAt: 1 });
reservationSchema.index({ booking: 1 });

export const Reservation = mongoose.model('Reservation', reservationSchema);
