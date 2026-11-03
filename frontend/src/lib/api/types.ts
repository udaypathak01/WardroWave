export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export type ApiResult<T> = Pick<ApiEnvelope<T>, 'data' | 'meta'>;

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminPageParams {
  page?: number;
  limit?: number;
  q?: string;
}

export interface AdminBooking {
  _id: string;
  bookingNumber: string;
  status: string;
  createdAt: string;
  user?: { _id: string; name?: string; email?: string; phone?: string } | null;
  items?: Array<{ _id?: string; titleSnapshot: string; status?: string }>;
  pricing: { grandTotal: number; rentalSubtotal?: number; depositTotal?: number };
  payment?: { status?: string };
  shippingAddress?: Address;
  timeline?: Array<{ status: string; note?: string; at: string; actor?: { name?: string } }>;
}

export interface AdminCustomer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  emailVerified: boolean;
  role: 'customer' | 'staff' | 'admin' | 'superadmin';
  status: 'active' | 'blocked';
  createdAt: string;
  lastLoginAt?: string;
  addresses?: Address[];
  bookingCount?: number;
  recentBookings?: Array<Pick<AdminBooking, '_id' | 'bookingNumber' | 'status' | 'createdAt' | 'pricing'>>;
  avatar?: { url?: string };
}

export interface AdminProduct extends Omit<Product, 'variants'> {
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  createdAt: string;
  variants?: Array<{ _id: string; sku: string; size: string; color: string; isActive: boolean; active?: boolean }>;
  inventory?: Array<{ status: string; count: number }>;
}

export interface CatalogVariantCreateInput {
  sku: string;
  size: string;
  color: string;
  unitCodes: string[];
}

export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  parent?: { _id: string; name: string; slug: string } | null;
  image?: { url?: string };
}

export interface AdminInventoryUnit {
  _id: string;
  unitCode: string;
  status: 'available' | 'reserved' | 'rented' | 'cleaning' | 'maintenance' | 'retired';
  condition: string;
  rentCount: number;
  maxRentCount: number;
  product?: { _id: string; title: string; slug: string; status: string } | null;
  variant?: { _id: string; sku: string; size: string; color: string; isActive: boolean } | null;
}

export interface AdminCoupon {
  _id: string;
  code: string;
  description?: string;
  type: 'percent' | 'flat';
  value: number;
  maxDiscount?: number;
  minRentalSubtotal: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  usedCount: number;
  reservedCount: number;
  applicableCategories?: Array<{ _id: string; name: string; slug: string }>;
  applicableProducts?: Array<{ _id: string; title: string; slug: string; status: string }>;
}

export interface AdminCouponCreateInput {
  code: string;
  description?: string;
  type: 'percent' | 'flat';
  value: number;
  startsAt: string;
  expiresAt: string;
  minRentalSubtotal?: number;
  perUserLimit?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  firstBookingOnly?: boolean;
  isActive?: boolean;
}

export interface AdminReview {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user?: { _id: string; name?: string; email?: string; avatar?: { url?: string } } | null;
  product?: { _id: string; title: string; slug: string; images?: Product['images'] } | null;
}

export interface AdminAuditLog {
  _id: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  createdAt: string;
  actor?: { _id: string; name?: string; email?: string; role?: string } | null;
}

export interface AdminPaymentRefund {
  _id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  notes?: string;
  razorpayRefundId?: string;
  createdAt: string;
  processedAt?: string;
}

export interface AdminPayment {
  _id: string;
  booking?: { _id: string; bookingNumber: string; status: string } | null;
  user?: { _id: string; name?: string; email?: string } | null;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  refundedAmount: number;
  refundReservedAmount: number;
  refundableAmount: number;
  currency: 'INR';
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';
  method?: string;
  bank?: string;
  cardLast4?: string;
  cardNetwork?: string;
  errorCode?: string;
  errorDescription?: string;
  paidAt?: string;
  createdAt: string;
  refunds: AdminPaymentRefund[];
}

export interface AdminDashboard {
  bookings: { total: number; pendingPayment: number; active: number };
  customers: { active: number };
  products: { total: number; drafts: number };
  inventory: { total: number; available: number };
  pendingReviews: number;
  recentBookings: AdminBooking[];
}

export interface AdminOperationsReport {
  period: { from: string; to: string };
  bookings: Array<{ status: string; count: number; bookingValue: number }>;
  payments: {
    capturedCount: number;
    capturedAmount: number;
    refundedAmount: number;
    netAmount: number;
  };
  inventory: Array<{ status: string; count: number }>;
}

export interface AdminSettings {
  minRentalDays: number;
  maxRentalDays: number;
  minLeadDays: number;
  maxAdvanceDays: number;
  deliveryBufferDays: number;
  returnBufferDays: number;
  holdMinutes: number;
  gstPercent: number;
  deliveryFee: number;
  freeDeliveryAbove: number;
  lateFeeMultiplier: number;
  freeCancelHours: number;
}

export interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface AddressInput {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CustomerProfile {
  _id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin' | 'superadmin';
  addresses: Address[];
  avatar?: { url: string; publicId?: string };
  measurements?: {
    heightCm?: number;
    bustCm?: number;
    waistCm?: number;
    hipsCm?: number;
    preferredSize?: string;
  };
  createdAt?: string;
}

export type ProfileUpdateInput = Pick<Partial<CustomerProfile>, 'name' | 'phone' | 'measurements'>;

export interface Product {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  category: { _id: string; name: string; slug: string } | string;
  occasions?: string[];
  brand?: string;
  gender?: 'women' | 'men' | 'unisex' | 'kids';
  images: Array<{ url: string; publicId?: string; isPrimary?: boolean }>;
  pricing: {
    basePrice: number;
    retailValue: number;
    securityDeposit: number;
    minRentalDays?: number;
    maxRentalDays?: number;
    extraDayPrice?: number;
  };
  variants?: ProductVariant[];
  ratingSummary?: { average: number; count: number };
}

export interface ProductImageInput {
  url: string;
  publicId?: string;
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductPricingInput {
  retailValue?: number;
  basePrice: number;
  extraDayPrice: number;
  securityDeposit: number;
  minRentalDays?: number;
  maxRentalDays?: number;
  deliveryBufferDays?: number;
  returnBufferDays?: number;
}

export interface ProductSizeChartInput {
  size: string;
  bust?: number;
  waist?: number;
  hips?: number;
  length?: number;
}

export interface CatalogProductCreateInput {
  title: string;
  description: string;
  brand?: string;
  category: string;
  gender: 'women' | 'men' | 'unisex' | 'kids';
  occasions?: Array<'wedding' | 'party' | 'festive' | 'cocktail' | 'casual' | 'formal'>;
  tags?: string[];
  colors?: string[];
  fabric?: string;
  careInstructions?: string[];
  fitNotes?: string[];
  images?: ProductImageInput[];
  pricing: ProductPricingInput;
  sizeChart?: ProductSizeChartInput[];
  status?: 'draft' | 'published' | 'archived';
  isFeatured?: boolean;
}

export type CatalogProductUpdateInput = Partial<Omit<CatalogProductCreateInput, 'pricing'>> & {
  pricing?: Partial<ProductPricingInput>;
};

export interface ProductReview {
  _id: string;
  product: string;
  booking: string;
  user: string | {
    _id: string;
    name?: string;
    avatar?: { url: string; publicId?: string };
  };
  rating: number;
  title: string;
  comment: string;
  fitFeedback?: 'runs_small' | 'true_to_size' | 'runs_large';
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewInput {
  bookingId: string;
  rating: number;
  title: string;
  comment: string;
  fitFeedback?: 'runs_small' | 'true_to_size' | 'runs_large';
  images?: string[];
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: { url?: string; publicId?: string };
  children?: Category[];
}

export interface ProductAvailability {
  blockedDates: Array<{ startDate: string; endDate: string }>;
  available?: boolean;
  availableCount?: number;
}

export interface ProductVariant {
  _id: string;
  size: string;
  color?: string;
  active: boolean;
}

export interface ProductSearch {
  q?: string;
  category?: string;
  occasion?: string;
  gender?: 'women' | 'men' | 'unisex' | 'kids';
  size?: string;
  color?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  startDate?: string;
  endDate?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating' | 'featured';
  page?: number;
  limit?: number;
}

export interface CartItemInput {
  variantId: string;
  startDate: string;
  endDate: string;
}

export interface BookingItemInput {
  variantId: string;
  startDate: string;
  endDate: string;
}

export interface BookingQuoteInput {
  items: BookingItemInput[];
  pincode: string;
  couponCode?: string;
}

export interface BookingCreateInput {
  addressId: string;
  items?: BookingItemInput[];
  couponCode?: string;
}

export interface PaymentVerificationInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface BookingPricing {
  rentalSubtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount: number;
  depositTotal: number;
  grandTotal: number;
  currency: 'INR';
}

export interface BookingItem {
  _id: string;
  titleSnapshot: string;
  imageSnapshot?: string;
  sizeSnapshot?: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  rentalCharge: number;
  securityDeposit: number;
  status: string;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  status: string;
  payment?: { status: string; razorpayOrderId?: string };
  items: BookingItem[];
  shippingAddress: Address;
  pricing: BookingPricing;
  createdAt: string;
}

export interface PaymentOrder {
  booking: Booking;
  razorpayOrderId: string;
  amount: number;
  currency: 'INR';
  keyId: string;
  prefill: { name: string; email: string; contact?: string };
  idempotent: boolean;
}

export interface PaymentVerificationResult {
  confirmed: boolean;
  bookingId: string;
  idempotent: boolean;
}

export interface QuoteItem {
  productId?: string;
  variantId?: string;
  title?: string;
  rentalDays: number;
  rentalCharge: number;
  securityDeposit: number;
  available: boolean | null;
  availableCount: number | null;
  failureReason: string | null;
}

export interface BookingQuote {
  items: QuoteItem[];
  rentalSubtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount: number;
  depositTotal: number;
  grandTotal: number;
  currency: 'INR';
  pincode: string;
  available: boolean;
  failureReason: string | null;
}

export interface CartItem {
  _id: string;
  product: Product;
  variant: ProductVariant;
  startDate: string;
  endDate: string;
}

export interface Cart {
  _id?: string;
  items: CartItem[];
  couponCode: string | null;
}

export interface Wishlist {
  products: Product[];
}

export interface WardrobeImage {
  _id: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  createdAt: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface RentalSettings {
  minRentalDays: number;
  maxRentalDays: number;
  minLeadDays: number;
  maxAdvanceDays: number;
  gstPercent: number;
  deliveryFee: number;
  freeDeliveryAbove: number;
  freeCancelHours: number;
  cancellationPolicy: string;
  razorpayKeyId: string | null;
  supportEmail: string;
}
