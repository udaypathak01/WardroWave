import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], validate: [(items) => items.length <= 10, 'Cart can contain at most 10 items'] },
    couponCode: { type: String, uppercase: true, trim: true },
  },
  { timestamps: true, versionKey: false }
);

export const Cart = mongoose.model('Cart', cartSchema);
