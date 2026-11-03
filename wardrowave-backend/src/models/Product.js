import mongoose from 'mongoose';
import { paiseField, safeIntegerField } from './schemaFields.js';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    brand: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    gender: { type: String, enum: ['women', 'men', 'unisex', 'kids'], required: true },
    occasions: [{ type: String, enum: ['wedding', 'party', 'festive', 'cocktail', 'casual', 'formal'] }],
    tags: [String],
    colors: [String],
    fabric: String,
    careInstructions: [String],
    fitNotes: [String],
    images: {
      type: [{
        url: { type: String, required: true },
        publicId: String,
        width: Number,
        height: Number,
        alt: String,
        isPrimary: Boolean,
        sortOrder: Number,
      }],
      validate: [(images) => images.length <= 8, 'A maximum of 8 images is allowed'],
    },
    pricing: {
      retailValue: paiseField(),
      basePrice: paiseField({ required: true }),
      extraDayPrice: paiseField({ required: true }),
      securityDeposit: paiseField({ required: true }),
      minRentalDays: safeIntegerField({ defaultValue: 3, min: 1 }),
      maxRentalDays: safeIntegerField({ defaultValue: 14, min: 1 }),
      deliveryBufferDays: safeIntegerField({ defaultValue: 1 }),
      returnBufferDays: safeIntegerField({ defaultValue: 2 }),
    },
    sizeChart: [{ size: String, bust: Number, waist: Number, hips: Number, length: Number }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: safeIntegerField({ defaultValue: 0 }),
    rentCount: safeIntegerField({ defaultValue: 0 }),
    viewCount: safeIntegerField({ defaultValue: 0 }),
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

productSchema.pre('validate', function validatePublishedImages(next) {
  if (this.status === 'published' && this.images.length === 0) {
    this.invalidate('images', 'Published products require at least one image');
  }
  if (this.pricing?.maxRentalDays < this.pricing?.minRentalDays) {
    this.invalidate('pricing.maxRentalDays', 'Maximum rental duration must not be less than minimum duration');
  }
  next();
});

productSchema.index({ title: 'text', brand: 'text', tags: 'text', description: 'text' }, { weights: { title: 10, brand: 5, tags: 3, description: 1 } });
productSchema.index({ status: 1, category: 1, 'pricing.basePrice': 1 });
productSchema.index({ status: 1, occasions: 1 });
productSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
productSchema.index({ status: 1, deletedAt: 1, rentCount: -1, ratingAvg: -1, _id: 1 });
productSchema.index({ status: 1, deletedAt: 1, ratingAvg: -1, ratingCount: -1 });
productSchema.index({ status: 1, deletedAt: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1, deletedAt: 1, createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
