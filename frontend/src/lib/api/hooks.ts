import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from './api';
import { queryKeys } from './queryKeys';
import type {
  BookingCreateInput,
  CartItemInput,
  ApiResult,
  CatalogProductCreateInput,
  CatalogProductUpdateInput,
  ProductSearch,
  Product,
  WardrobeImage,
  Wishlist,
} from './types';

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: api.users.me,
    enabled,
  });
}

export function useAddressQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.addresses,
    queryFn: api.users.addresses.list,
    enabled,
  });
}

export function useWardrobeQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.wardrobe,
    queryFn: api.users.wardrobe.list,
    enabled,
  });
}

export function useUploadWardrobeImageMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResult<WardrobeImage>,
    Error,
    { file: File; onProgress?: (progress: number) => void }
  >({
    mutationFn: ({ file, onProgress }) => api.users.wardrobe.upload(file, onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wardrobe }),
  });
}

export function useRemoveWardrobeImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.wardrobe.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wardrobe }),
  });
}

export function useProductsQuery(filters: ProductSearch = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.catalog.products(filters),
    queryFn: () => api.catalog.products(filters),
    enabled,
  });
}

export function useFeaturedProductsQuery() {
  return useQuery({
    queryKey: ['catalog', 'featured'] as const,
    queryFn: () => api.catalog.featured({ limit: 20 }),
  });
}

export function useSimilarProductsQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.catalog.similar(slug),
    queryFn: () => api.catalog.similar(slug),
    enabled: enabled && Boolean(slug),
  });
}

export function useProductQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.catalog.product(slug),
    queryFn: () => api.catalog.product(slug),
    enabled: enabled && Boolean(slug),
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.catalog.categories(),
    queryFn: api.catalog.categories,
  });
}

export function useProductReviewsQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.catalog.reviews(slug),
    queryFn: () => api.catalog.reviews(slug),
    enabled: enabled && Boolean(slug),
  });
}

export function useProductAvailabilityQuery(
  slug: string,
  variantId: string,
  startDate: string,
  endDate: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.catalog.availability(slug, variantId, startDate, endDate),
    queryFn: () => api.catalog.availability(
      slug,
      variantId,
      startDate,
      endDate,
      startDate,
      endDate,
    ),
    enabled: enabled && Boolean(slug && variantId && startDate && endDate),
  });
}

export function useCartQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: api.cart.get,
    enabled,
  });
}

export function useWishlistQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: api.wishlist.get,
    enabled,
  });
}

export function useBookingsQuery(filters: { page?: number; limit?: number } = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: () => api.bookings.list(filters),
    enabled,
  });
}

export function useBookingQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => api.bookings.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function usePublicConfigQuery() {
  return useQuery({
    queryKey: queryKeys.publicConfig,
    queryFn: api.publicConfig.get,
  });
}

export function useAddCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: CartItemInput) => api.cart.add(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api.cart.remove(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
  });
}

export function useApplyCartCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponCode: string | null) => api.cart.applyCoupon(couponCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
  });
}

export function useClearCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.cart.clear,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
  });
}

export function useToggleWishlistMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResult<Wishlist> | ApiResult<{ removed: boolean }>,
    Error,
    { productId: string; add: boolean }
  >({
    mutationFn: ({ productId, add }: { productId: string; add: boolean }) =>
      add ? api.wishlist.add(productId) : api.wishlist.remove(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wishlist }),
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      booking,
      idempotencyKey,
    }: {
      booking: BookingCreateInput;
      idempotencyKey: string;
    }) => api.bookings.create(booking, idempotencyKey),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
      ]);
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.bookings.cancel(id, reason),
    onSuccess: (_, { id }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) }),
      ]),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.users.update,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
      ]);
    },
  });
}

export function useAddAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.users.addresses.add,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
      ]);
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.users.addresses.update>[1] }) =>
      api.users.addresses.update(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
      ]);
    },
  });
}

export function useRemoveAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.users.addresses.remove(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.addresses }),
      ]);
    },
  });
}

export function useVerifyPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.payments.verify,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
  });
}

export function useRetryPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.bookings.retryPayment,
    onSuccess: (_, id) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) }),
      ]),
  });
}

export function useCatalogProductMutation() {
  const queryClient = useQueryClient();
  type CatalogProductMutation =
    | { action: 'create'; data: CatalogProductCreateInput }
    | { action: 'update'; id: string; data: CatalogProductUpdateInput }
    | { action: 'delete'; id: string };
  return useMutation<
    ApiResult<Product> | ApiResult<{ deleted: boolean }>,
    Error,
    CatalogProductMutation
  >({
    mutationFn: (variables) => {
      if (variables.action === 'create') return api.catalog.create(variables.data);
      if (variables.action === 'update') return api.catalog.update(variables.id, variables.data);
      return api.catalog.delete(variables.id);
    },
    onSuccess: async (_, variables) => {
      const invalidations = [queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all })];
      if (variables.action !== 'create') {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.catalog.product(variables.id) }),
        );
      }
      await Promise.all(invalidations);
    },
  });
}
