import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true },
    fitFeedback: { type: String, enum: ['runs_small', 'true_to_size', 'runs_large'] },
    images: [String],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

reviewSchema.index({ user: 1, booking: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
