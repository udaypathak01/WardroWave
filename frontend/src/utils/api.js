import { api as backendApi } from '../lib/api/api';

const legacyResponse = async (result) => {
  const resolved = await result;
  if (resolved && typeof resolved === 'object' && 'data' in resolved) {
    return { success: true, ...resolved };
  }
  return { success: true, data: resolved };
};

export function getRentalDate(offsetDays = 1) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function rentalCalendarDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function addRentalDays(startDate, offsetDays) {
  const [year, month, day] = rentalCalendarDate(startDate).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function mapCatalogProduct(product) {
  if (!product) return null;
  const image = product.primaryImage?.url
    || product.images?.find((entry) => entry.isPrimary)?.url
    || product.images?.[0]?.url
    || '';
  return {
    ...product,
    id: product._id || product.id,
    name: product.title || product.name || '',
    category: product.category?.name || product.category || '',
    categorySlug: product.category?.slug || '',
    image,
    rentalPrice: Number(product.pricing?.basePrice ?? product.price ?? 0) / 100,
    originalPrice: Number(product.pricing?.retailValue ?? product.originalPrice ?? 0) / 100,
    rating: product.ratingSummary?.average ?? product.ratingAvg ?? product.rating ?? 0,
    reviews: product.ratingSummary?.count ?? product.ratingCount ?? product.reviews ?? 0,
    duration: product.pricing?.minRentalDays ?? 3,
    inStock: product.inStock ?? (
      product.variants
        ? product.variants.some((variant) => variant.active !== false && variant.isActive !== false)
        : true
    ),
  };
}

export const authAPI = {
  syncProfile: (data = {}) => legacyResponse(backendApi.auth.sync(data.phone)),
  getMe: () => legacyResponse(backendApi.auth.me()),
  updateGender: (data) => legacyResponse(backendApi.auth.update(data)),
  logout: () => Promise.resolve({ success: true }),
  deleteAccount: () => legacyResponse(backendApi.auth.delete()),
};

export const userAPI = {
  getProfile: () => legacyResponse(backendApi.users.me()),
  updateProfile: (data) => legacyResponse(backendApi.users.update(data)),
  getAddresses: () => legacyResponse(backendApi.users.addresses.list()),
  addAddress: (address) => {
    const payload = {
      label: address.label || 'Home',
      fullName: address.fullName || address.name || '',
      phone: address.phone?.startsWith('+')
        ? address.phone
        : `+91${(address.phone || '').replace(/\D/g, '').replace(/^91/, '')}`,
      line1: address.line1 || address.addressLine1 || address.street || '',
      line2: address.line2 || address.addressLine2 || '',
      landmark: address.landmark || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      isDefault: Boolean(address.isDefault),
    };
    return legacyResponse(backendApi.users.addresses.add(payload));
  },
  updateAddress: (id, address) => {
    const payload = {
      ...(address.label && { label: address.label }),
      ...(address.fullName && { fullName: address.fullName }),
      ...(address.phone && {
        phone: address.phone.startsWith('+')
          ? address.phone
          : `+91${address.phone.replace(/\D/g, '').replace(/^91/, '')}`,
      }),
      ...((address.line1 || address.addressLine1) && {
        line1: address.line1 || address.addressLine1,
      }),
      ...((address.line2 || address.addressLine2) && {
        line2: address.line2 || address.addressLine2,
      }),
      ...(address.landmark && { landmark: address.landmark }),
      ...(address.city && { city: address.city }),
      ...(address.state && { state: address.state }),
      ...(address.pincode && { pincode: address.pincode }),
      ...(address.isDefault !== undefined && { isDefault: address.isDefault }),
    };
    return legacyResponse(backendApi.users.addresses.update(id, payload));
  },
  deleteAddress: (id) => legacyResponse(backendApi.users.addresses.remove(id)),
};

export const productAPI = {
  getAll: (params = {}) => legacyResponse(backendApi.catalog.products(params)),
  getFeatured: (params = {}) => legacyResponse(backendApi.catalog.featured(params)),
  getSimilar: (slug) => legacyResponse(backendApi.catalog.similar(slug)),
  getCategories: () => legacyResponse(backendApi.catalog.categories()),
  getById: (slug) => legacyResponse(backendApi.catalog.product(slug)),
  getAvailability: (slug, variantId, from, to) =>
    legacyResponse(backendApi.catalog.availability(slug, variantId, from, to)),
  create: (data) => legacyResponse(backendApi.catalog.create(data)),
  update: (id, data) => legacyResponse(backendApi.catalog.update(id, data)),
  delete: (id) => legacyResponse(backendApi.catalog.delete(id)),
  addReview: (productId, data) =>
    legacyResponse(backendApi.catalog.addReview(productId, data)),
};

export const cartAPI = {
  get: () => legacyResponse(backendApi.cart.get()),
  add: (variantId, _quantity = 1, rentalDays = 3, options = {}) => {
    const startDate = options.startDate || getRentalDate(1);
    const endDate = options.endDate || addRentalDays(startDate, Number(rentalDays) - 1);
    return legacyResponse(backendApi.cart.add({ variantId, startDate, endDate }));
  },
  remove: (itemId) => legacyResponse(backendApi.cart.remove(itemId)),
  clear: () => legacyResponse(backendApi.cart.clear()),
  applyCoupon: (couponCode) => legacyResponse(backendApi.cart.applyCoupon(couponCode)),
};

export const wishlistAPI = {
  get: () => legacyResponse(backendApi.wishlist.get()),
  toggle: (productId, shouldAdd) =>
    legacyResponse(shouldAdd
      ? backendApi.wishlist.add(productId)
      : backendApi.wishlist.remove(productId)),
  add: (productId) => legacyResponse(backendApi.wishlist.add(productId)),
  remove: (productId) => legacyResponse(backendApi.wishlist.remove(productId)),
  clear: (productIds = []) => legacyResponse(Promise.all(
    productIds.map((productId) => backendApi.wishlist.remove(productId)),
  )),
};

export const orderAPI = {
  create: (data, idempotencyKey) =>
    legacyResponse(backendApi.bookings.create(data, idempotencyKey)),
  getQuote: (quoteData) => legacyResponse(backendApi.bookings.quote(quoteData)),
  getAll: (params = {}) => legacyResponse(backendApi.bookings.list(params)),
  getById: (bookingId) => legacyResponse(backendApi.bookings.get(bookingId)),
  cancel: (bookingId, reason) =>
    legacyResponse(backendApi.bookings.cancel(bookingId, reason)),
  retryPayment: (bookingId) =>
    legacyResponse(backendApi.bookings.retryPayment(bookingId)),
  verifyPayment: (paymentData) =>
    legacyResponse(backendApi.payments.verify(paymentData)),
  getInvoice: (bookingId) => backendApi.bookings.invoice(bookingId),
};

const api = {
  auth: authAPI,
  user: userAPI,
  product: productAPI,
  cart: cartAPI,
  wishlist: wishlistAPI,
  order: orderAPI,
};

export default api;
