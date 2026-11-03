import mongoose from 'mongoose';

const adminAccessLockSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'user-access' },
    version: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const AdminAccessLock = mongoose.model('AdminAccessLock', adminAccessLockSchema);
