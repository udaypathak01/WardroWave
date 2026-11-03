export const queryKeys = {
  profile: ['profile'] as const,
  addresses: ['profile', 'addresses'] as const,
  wardrobe: ['profile', 'wardrobe'] as const,
  catalog: {
    all: ['catalog'] as const,
    categories: () => ['catalog', 'categories'] as const,
    products: (filters: object = {}) =>
      ['catalog', 'products', filters] as const,
    product: (slug: string) => ['catalog', 'product', slug] as const,
    similar: (slug: string) => ['catalog', 'similar', slug] as const,
    reviews: (slug: string) => ['catalog', 'reviews', slug] as const,
    availability: (slug: string, variantId: string, startDate: string, endDate: string) =>
      ['catalog', 'availability', slug, variantId, startDate, endDate] as const,
  },
  cart: ['cart'] as const,
  wishlist: ['wishlist'] as const,
  bookings: {
    all: ['bookings'] as const,
    list: (filters: object = {}) =>
      ['bookings', 'list', filters] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
  },
  publicConfig: ['public-config'] as const,
} as const;
