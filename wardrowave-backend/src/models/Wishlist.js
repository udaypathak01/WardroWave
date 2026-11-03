import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    products: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      validate: [(products) => products.length <= 200, 'Wishlist can contain at most 200 products'],
    },
  },
  { timestamps: true, versionKey: false }
);

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
