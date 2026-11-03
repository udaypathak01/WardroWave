import mongoose from 'mongoose';
import { safeIntegerField } from './schemaFields.js';

const wardrobeImageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    width: safeIntegerField({ required: true, min: 1 }),
    height: safeIntegerField({ required: true, min: 1 }),
    bytes: safeIntegerField({ required: true, min: 1 }),
    format: { type: String, enum: ['jpeg', 'png', 'webp'], required: true },
  },
  { timestamps: true, versionKey: false },
);

wardrobeImageSchema.index({ user: 1, createdAt: -1 });

export const WardrobeImage = mongoose.model('WardrobeImage', wardrobeImageSchema);
