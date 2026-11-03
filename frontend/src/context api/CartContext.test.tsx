import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCart, CartProvider } from './CartContext';
import api from '../utils/api';
import { useAuth } from './AuthContext';

vi.mock('../utils/api', () => ({
  default: {
    cart: {
      get: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  addRentalDays: (date: string, days: number) => date,
  getRentalDate: () => '2026-05-01',
  rentalCalendarDate: (date: string) => date.slice(0, 10),
}));
vi.mock('./AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mockedUseAuth = vi.mocked(useAuth as () => { isAuthenticated: boolean });

function CartProbe() {
  const { cart, addToCart, error, isLoading } = useCart();
  return (
    <div>
      {isLoading && <p>Loading cart</p>}
      {error && <p>{error}</p>}
      <p>{cart[0]?.name || 'Empty cart'}</p>
      <button
        type="button"
        onClick={() => addToCart({
          variantId: 'variant-1',
          variants: [{ _id: 'variant-1', active: true }],
        }, 3, { startDate: '2026-05-01', endDate: '2026-05-03' })}
      >
        Add item
      </button>
    </div>
  );
}

describe('CartProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });
    vi.mocked(api.cart.get).mockResolvedValue({
      data: {
        items: [{
          _id: 'cart-item-1',
          product: {
            _id: 'product-1',
            title: 'Rental dress',
            pricing: { basePrice: 30000 },
            images: [{ url: 'https://cdn.example.test/dress.jpg' }],
          },
          variant: { _id: 'variant-1', size: 'M' },
          startDate: '2026-05-01T00:00:00.000Z',
          endDate: '2026-05-03T00:00:00.000Z',
        }],
      },
    });
    vi.mocked(api.cart.add).mockResolvedValue({ data: {} });
  });

  it('loads and maps backend cart data', async () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    expect(await screen.findByText('Rental dress')).toBeInTheDocument();
    expect(api.cart.get).toHaveBeenCalledOnce();
  });

  it('adds a selected variant using the backend cart contract', async () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Add item' }));

    await waitFor(() => {
      expect(api.cart.add).toHaveBeenCalledWith(
        'variant-1',
        1,
        3,
        { startDate: '2026-05-01', endDate: '2026-05-03' },
      );
    });
    expect(await screen.findByText('Rental dress')).toBeInTheDocument();
  });
});
