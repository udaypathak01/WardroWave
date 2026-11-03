import mongoose from 'mongoose';

const serviceablePincodeSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true, unique: true, match: /^\d{6}$/ },
    city: { type: String, required: true },
    state: { type: String, required: true },
    deliveryDays: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export const ServiceablePincode = mongoose.model('ServiceablePincode', serviceablePincodeSchema);
