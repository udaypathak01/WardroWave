import { apiClient, apiRequestBlob, apiUpload } from './client';
import type {
  Address,
  AddressInput,
  AdminAuditLog,
  AdminBooking,
  AdminCategory,
  AdminCoupon,
  AdminCouponCreateInput,
  AdminCustomer,
  AdminDashboard,
  AdminInventoryUnit,
  AdminOperationsReport,
  AdminPayment,
  AdminPageParams,
  AdminProduct,
  AdminReview,
  AdminSettings,
  Booking,
  BookingCreateInput,
  BookingQuote,
  BookingQuoteInput,
  ContactMessageInput,
  Cart,
  CartItemInput,
  CatalogProductCreateInput,
  CatalogProductUpdateInput,
  CatalogVariantCreateInput,
  Category,
  CustomerProfile,
  PaymentVerificationInput,
  PaymentOrder,
  PaymentVerificationResult,
  ProductAvailability,
  Product,
  ProductSearch,
  ProductReview,
  ProductReviewInput,
  ProfileUpdateInput,
  RentalSettings,
  Wishlist,
  WardrobeImage,
} from './types';

function queryString(params: object): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  return query.toString();
}

export const api = {
  admin: {
    dashboard: () => apiClient.get<AdminDashboard>('/admin/dashboard'),
    reportSummary: (from: string, to: string) => {
      const query = queryString({ from, to });
      return apiClient.get<AdminOperationsReport>(`/admin/reports/summary?${query}`);
    },
    bookings: (params: AdminPageParams & {
      status?: string; userId?: string; from?: string; to?: string;
    } = {}) => {
      const query = queryString(params);
      return apiClient.get<AdminBooking[]>(`/admin/bookings${query ? `?${query}` : ''}`);
    },
    booking: (id: string) =>
      apiClient.get<AdminBooking>(`/admin/bookings/${encodeURIComponent(id)}`),
    customers: (params: AdminPageParams & {
      role?: AdminCustomer['role']; status?: AdminCustomer['status'];
    } = {}) => {
      const query = queryString(params);
      return apiClient.get<AdminCustomer[]>(`/admin/customers${query ? `?${query}` : ''}`);
    },
    customer: (id: string) =>
      apiClient.get<AdminCustomer>(`/admin/customers/${encodeURIComponent(id)}`),
    updateUserAccess: (id: string, data: { role?: AdminCustomer['role']; status?: AdminCustomer['status'] }) =>
      apiClient.patch<AdminCustomer>(`/admin/users/${encodeURIComponent(id)}/access`, data),
    products: (params: AdminPageParams & {
      status?: AdminProduct['status']; category?: string; isFeatured?: boolean;
    } = {}) => {
      const query = queryString(params);
      return apiClient.get<AdminProduct[]>(`/admin/products${query ? `?${query}` : ''}`);
    },
    product: (id: string) =>
      apiClient.get<AdminProduct>(`/admin/products/${encodeURIComponent(id)}`),
    createProduct: (data: CatalogProductCreateInput) =>
      apiClient.post<AdminProduct>('/admin/products', data),
    updateProduct: (id: string, data: CatalogProductUpdateInput) =>
      apiClient.patch<AdminProduct>(`/admin/products/${encodeURIComponent(id)}`, data),
    createVariant: (id: string, data: CatalogVariantCreateInput) =>
      apiClient.post(`/admin/products/${encodeURIComponent(id)}/variants`, data),
    archiveProduct: (id: string) =>
      apiClient.delete<AdminProduct>(`/admin/products/${encodeURIComponent(id)}`),
    categories: (params: AdminPageParams & { isActive?: boolean } = {}) => {
      const query = queryString(params);
      return apiClient.get<AdminCategory[]>(`/admin/categories${query ? `?${query}` : ''}`);
    },
    createCategory: (data: { name: string; isActive?: boolean; sortOrder?: number }) =>
      apiClient.post<AdminCategory>('/admin/categories', data),
    updateCategory: (id: string, data: { name?: string; isActive?: boolean; sortOrder?: number }) =>
      apiClient.patch<AdminCategory>(`/admin/categories/${encodeURIComponent(id)}`, data),
    inventory: (params: AdminPageParams & {
      status?: AdminInventoryUnit['status']; productId?: string; variantId?: string;
    } = {}) => {
      const query = queryString(params);
      return apiClient.get<AdminInventoryUnit[]>(`/admin/inventory${query ? `?${query}` : ''}`);
    },
    updateInventoryStatus: (id: string, status: 'available' | 'maintenance' | 'retired') =>
      apiClient.patch<AdminInventoryUnit>(`/admin/inventory/${encodeURIComponent(id)}/status`, { status }),
    coupons: (params: AdminPageParams & { isActive?: boolean } = {}) => {
      const query = queryString(params);
      return apiClient.get<AdminCoupon[]>(`/admin/coupons${query ? `?${query}` : ''}`);
    },
    coupon: (id: string) =>
      apiClient.get<AdminCoupon>(`/admin/coupons/${encodeURIComponent(id)}`),
    createCoupon: (data: AdminCouponCreateInput) =>
      apiClient.post<AdminCoupon>('/admin/coupons', data),
    updateCoupon: (id: string, data: { isActive?: boolean }) =>
      apiClient.patch<AdminCoupon>(`/admin/coupons/${encodeURIComponent(id)}`, data),
    reviews: (params: AdminPageParams & { status?: AdminReview['status'] } = {}) => {
      const query = queryString(params);
      return apiClient.get<AdminReview[]>(`/admin/reviews${query ? `?${query}` : ''}`);
    },
    moderateReview: (id: string, status: 'approved' | 'rejected') =>
      apiClient.patch<AdminReview>(`/admin/reviews/${encodeURIComponent(id)}/moderation`, { status }),
    auditLogs: (params: AdminPageParams & {
      from?: string; to?: string; action?: string; entityType?: string; actorId?: string;
    } = {}) => {
      const query = queryString(params);
      return apiClient.get<AdminAuditLog[]>(`/admin/audit-logs${query ? `?${query}` : ''}`);
    },
    payments: (params: AdminPageParams & {
      status?: AdminPayment['status']; from?: string; to?: string;
    } = {}) => {
      const query = queryString(params);
      return apiClient.get<AdminPayment[]>(`/admin/payments${query ? `?${query}` : ''}`);
    },
    initiateRefund: (id: string, data: { amount: number; notes: string }) =>
      apiClient.post(`/admin/payments/${encodeURIComponent(id)}/refunds`, data),
    deleteCustomer: (id: string) =>
      apiClient.delete<{ deleted: boolean }>(`/admin/users/${encodeURIComponent(id)}`),
    settings: () => apiClient.get<AdminSettings>('/admin/settings'),
    updateSettings: (data: Partial<AdminSettings>) =>
      apiClient.patch<AdminSettings>('/admin/settings', data),
    updatePincode: (pincode: string, data: {
      city: string; state: string; deliveryDays: number; isActive?: boolean;
    }) => apiClient.put(`/admin/pincodes/${encodeURIComponent(pincode)}`, data),
  },
  staff: {
    dispatch: (id: string, data: { carrier: string; trackingNumber: string }) =>
      apiClient.post<AdminBooking>(`/staff/bookings/${encodeURIComponent(id)}/dispatch`, data),
    deliver: (id: string) =>
      apiClient.post<AdminBooking>(`/staff/bookings/${encodeURIComponent(id)}/deliver`),
    receiveReturn: (id: string, data: { carrier: string; trackingNumber: string }) =>
      apiClient.post<AdminBooking>(`/staff/bookings/${encodeURIComponent(id)}/receive`, data),
    inspectReturn: (id: string, data: { items: Array<{
      itemId: string; damageLevel: 'none' | 'minor' | 'major' | 'lost';
      damageCharge: number; notes?: string; photos: string[];
    }> }) => apiClient.post(`/staff/bookings/${encodeURIComponent(id)}/inspect`, data),
    markUnitClean: (id: string) =>
      apiClient.post<AdminInventoryUnit>(`/staff/inventory/${encodeURIComponent(id)}/clean`),
  },
  auth: {
    sync: (phone?: string) =>
      apiClient.post<{ user: CustomerProfile }>('/auth/sync', phone ? { phone } : {}),
    me: () => apiClient.get<CustomerProfile>('/users/me'),
    update: (data: ProfileUpdateInput) =>
      apiClient.patch<CustomerProfile>('/users/me', data),
    delete: () => apiClient.delete<{ deleted: boolean }>('/users/me'),
  },
  users: {
    me: () => apiClient.get<CustomerProfile>('/users/me'),
    update: (data: ProfileUpdateInput) =>
      apiClient.patch<CustomerProfile>('/users/me', data),
    addresses: {
      list: async () => (await apiClient.get<CustomerProfile>('/users/me')).data.addresses,
      add: (data: AddressInput) =>
        apiClient.post<Address>('/users/me/addresses', data),
      update: (id: string, data: Partial<AddressInput>) =>
        apiClient.patch<Address>(
          `/users/me/addresses/${encodeURIComponent(id)}`,
          data,
        ),
      remove: (id: string) =>
        apiClient.delete<{ deleted: boolean }>(
          `/users/me/addresses/${encodeURIComponent(id)}`,
        ),
    },
    wardrobe: {
      list: () => apiClient.get<WardrobeImage[]>('/users/me/wardrobe'),
      upload: (file: File, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('image', file);
        return apiUpload<WardrobeImage>('/users/me/wardrobe', formData, onProgress);
      },
      remove: (id: string) =>
        apiClient.delete<{ deleted: boolean }>(
          `/users/me/wardrobe/${encodeURIComponent(id)}`,
        ),
    },
  },
  catalog: {
    categories: () => apiClient.get<Category[]>('/categories'),
    products: (params: ProductSearch = {}) =>
      apiClient.get<Product[]>(
        `/products${queryString(params) ? `?${queryString(params)}` : ''}`,
      ),
    featured: (params: ProductSearch = {}) => {
      const query = queryString(params);
      return apiClient.get<Product[]>(`/products/featured${query ? `?${query}` : ''}`);
    },
    product: (slug: string) =>
      apiClient.get<Product>(`/products/${encodeURIComponent(slug)}`),
    similar: (slug: string) =>
      apiClient.get<Product[]>(`/products/${encodeURIComponent(slug)}/similar`),
    reviews: (slug: string) =>
      apiClient.get<ProductReview[]>(`/products/${encodeURIComponent(slug)}/reviews`),
    availability: (
      slug: string,
      variantId: string,
      from: string,
      to: string,
      startDate?: string,
      endDate?: string,
    ) => {
      const query = queryString({ variantId, from, to, startDate, endDate });
      return apiClient.get<ProductAvailability>(
        `/products/${encodeURIComponent(slug)}/availability?${query}`,
      );
    },
    create: (data: CatalogProductCreateInput) =>
      apiClient.post<Product>('/admin/products', data),
    update: (id: string, data: CatalogProductUpdateInput) =>
      apiClient.patch<Product>(`/admin/products/${encodeURIComponent(id)}`, data),
    delete: (id: string) =>
      apiClient.delete<{ deleted: boolean }>(`/admin/products/${encodeURIComponent(id)}`),
    addReview: (productId: string, data: ProductReviewInput) =>
      apiClient.post<ProductReview>(
        `/catalog/products/${encodeURIComponent(productId)}/reviews`,
        data,
      ),
  },
  cart: {
    get: () => apiClient.get<Cart>('/cart'),
    add: (item: CartItemInput) => apiClient.post<Cart>('/cart/items', item),
    remove: (id: string) =>
      apiClient.delete<Cart>(`/cart/items/${encodeURIComponent(id)}`),
    clear: () => apiClient.delete<{ cleared: boolean }>('/cart'),
    applyCoupon: (couponCode: string | null) =>
      apiClient.patch<Cart>('/cart/coupon', { couponCode }),
  },
  wishlist: {
    get: () => apiClient.get<Wishlist>('/wishlist'),
    add: (productId: string) =>
      apiClient.post<Wishlist>(`/wishlist/${encodeURIComponent(productId)}`),
    remove: (productId: string) =>
      apiClient.delete<{ removed: boolean }>(`/wishlist/${encodeURIComponent(productId)}`),
  },
  bookings: {
    quote: (data: BookingQuoteInput) =>
      apiClient.post<BookingQuote>('/bookings/quote', data),
    create: (data: BookingCreateInput, idempotencyKey: string) =>
      apiClient.post<PaymentOrder>('/bookings', data, { 'Idempotency-Key': idempotencyKey }),
    list: (params: { page?: number; limit?: number } = {}) => {
      const query = queryString(params);
      return apiClient.get<Booking[]>(`/bookings${query ? `?${query}` : ''}`);
    },
    get: (id: string) =>
      apiClient.get<Booking>(`/bookings/${encodeURIComponent(id)}`),
    cancel: (id: string, reason?: string) =>
      apiClient.post<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, { reason }),
    retryPayment: (id: string) =>
      apiClient.post<PaymentOrder>(`/bookings/${encodeURIComponent(id)}/retry-payment`),
    invoice: (id: string) =>
      apiRequestBlob(`/bookings/${encodeURIComponent(id)}/invoice`),
  },
  payments: {
    verify: (data: PaymentVerificationInput) =>
      apiClient.post<PaymentVerificationResult>('/payments/verify', data),
  },
  publicConfig: {
    get: () => apiClient.get<RentalSettings>('/meta/config'),
  },
  contact: {
    submit: (data: ContactMessageInput) =>
      apiClient.post<{ accepted: boolean }>('/contact', data),
  },
};

export default api;
