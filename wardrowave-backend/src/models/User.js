import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, match: /^\+[1-9]\d{7,14}$/ },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, match: /^\+[1-9]\d{7,14}$/ },
    avatar: { url: String, publicId: String },
    role: { type: String, enum: ['customer', 'staff', 'admin', 'superadmin'], default: 'customer' },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    addresses: {
      type: [addressSchema],
      validate: [(addresses) => addresses.length <= 10, 'A maximum of 10 addresses is allowed'],
    },
    measurements: {
      heightCm: Number,
      bustCm: Number,
      waistCm: Number,
      hipsCm: Number,
      preferredSize: String,
    },
    lastLoginAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_, ret) => {
        delete ret.firebaseUid;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, status: 1, deletedAt: 1, createdAt: -1 });
userSchema.pre('validate', function validateDefaultAddress(next) {
  const defaults = this.addresses.filter((address) => address.isDefault);
  if (this.addresses.length > 0 && defaults.length !== 1) {
    this.invalidate('addresses', 'Exactly one address must be the default');
  }
  next();
});

export const User = mongoose.model('User', userSchema);
