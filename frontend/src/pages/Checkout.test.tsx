import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Checkout from './Checkout';
import api from '../utils/api';
import { useAuth } from '../context api/AuthContext';
import { useCart } from '../context api/CartContext';

vi.mock('../utils/api', () => ({
  default: {
    order: {
      getQuote: vi.fn(),
      create: vi.fn(),
      verifyPayment: vi.fn(),
      getById: vi.fn(),
    },
    user: {
      addAddress: vi.fn(),
      updateAddress: vi.fn(),
    },
  },
  rentalCalendarDate: (date: string) => date.slice(0, 10),
}));
vi.mock('../context api/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../context api/CartContext', () => ({ useCart: vi.fn() }));
vi.mock('../components/common/Header', () => ({ default: () => <header /> }));
vi.mock('../components/common/Footer', () => ({ default: () => <footer /> }));

type AuthValue = { user: Record<string, unknown> };
type CartValue = {
  cart: Array<Record<string, string | number>>;
  couponCode: string | null;
  isLoading: boolean;
  getCartTotal: () => number;
  clearCart: () => Promise<void>;
};

const mockedUseAuth = vi.mocked(useAuth as () => AuthValue);
const mockedUseCart = vi.mocked(useCart as () => CartValue);
const razorpayOpen = vi.fn();
const clearCart = vi.fn();
let razorpayHandler: ((result: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => Promise<void>) | undefined;

describe('Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: {
        _id: 'user-1',
        name: 'Test Customer',
        email: 'customer@example.test',
        phone: '9876543210',
        addresses: [{
          _id: 'address-1',
          fullName: 'Test Customer',
          phone: '9876543210',
          line1: '1 Test Street',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          isDefault: true,
        }],
      },
    });
    mockedUseCart.mockReturnValue({
      cart: [{
        id: 'cart-item-1',
        variantId: 'variant-1',
        name: 'Rental dress',
        quantity: 1,
        rentalDays: 3,
        rentalPrice: 300,
        minRentalDays: 3,
        startDate: '2026-05-01',
        endDate: '2026-05-03',
      }],
      couponCode: null,
      isLoading: false,
      getCartTotal: () => 300,
      clearCart,
    });
    vi.mocked(api.order.getQuote).mockResolvedValue({
      data: {
        available: true,
        rentalSubtotal: 30000,
        discount: 0,
        gstAmount: 5400,
        gstPercent: 18,
        deliveryFee: 0,
        depositTotal: 0,
        grandTotal: 35400,
      },
    });
    vi.mocked(api.order.create).mockResolvedValue({
      data: {
        booking: { _id: 'booking-1', bookingNumber: 'WW-1001' },
        razorpayOrderId: 'razorpay-order-1',
        keyId: 'rzp_test_key',
        amount: 35400,
        currency: 'INR',
        prefill: {},
      },
    });
    vi.mocked(api.order.verifyPayment).mockResolvedValue({
      data: { bookingId: 'booking-1' },
    });
    vi.mocked(api.order.getById).mockResolvedValue({
      data: {
        _id: 'booking-1',
        bookingNumber: 'WW-1001',
        shippingAddress: {
          fullName: 'Test Customer',
          phone: '9876543210',
          line1: '1 Test Street',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
        },
        items: [{
          titleSnapshot: 'Rental dress',
          imageSnapshot: 'https://cdn.example.test/dress.jpg',
          rentalDays: 3,
          rentalCharge: 30000,
        }],
        pricing: {
          rentalSubtotal: 30000,
          discount: 0,
          couponCode: null,
          gstAmount: 5400,
          gstPercent: 18,
          deliveryFee: 0,
          depositTotal: 0,
          grandTotal: 35400,
        },
        payment: { status: 'paid' },
        status: 'confirmed',
        createdAt: '2026-05-01T00:00:00.000Z',
      },
    });

    clearCart.mockResolvedValue(undefined);
    razorpayHandler = undefined;
    vi.stubGlobal('crypto', { randomUUID: () => 'checkout-idempotency-key' });
    vi.stubGlobal('Razorpay', class {
      constructor(options: { handler: typeof razorpayHandler }) {
        razorpayHandler = options.handler;
      }
      on() {}
      open = razorpayOpen;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a backend booking and opens hosted Razorpay Checkout', async () => {
    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cart" element={<p>Cart</p>} />
          <Route path="/login" element={<p>Login</p>} />
          <Route path="/order-success" element={<p>Order success</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Rental dates and delivery area are available.'))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /deliver to this address/i }));
    fireEvent.click(screen.getByRole('button', { name: /pay securely with razorpay/i }));

    await waitFor(() => {
      expect(api.order.create).toHaveBeenCalledWith(
        { addressId: 'address-1' },
        'checkout-idempotency-key',
      );
      expect(razorpayOpen).toHaveBeenCalledOnce();
    });

    const paymentHandler = razorpayHandler;
    if (!paymentHandler) throw new Error('Razorpay success handler was not registered.');
    await act(async () => {
      await paymentHandler({
        razorpay_order_id: 'razorpay-order-1',
        razorpay_payment_id: 'razorpay-payment-1',
        razorpay_signature: 'provider-signature',
      });
    });

    expect(api.order.verifyPayment).toHaveBeenCalledWith({
      razorpay_order_id: 'razorpay-order-1',
      razorpay_payment_id: 'razorpay-payment-1',
      razorpay_signature: 'provider-signature',
    });
    expect(api.order.getById).toHaveBeenCalledWith('booking-1');
    expect(clearCart).toHaveBeenCalledOnce();
    expect(await screen.findByText(/order success/i)).toBeInTheDocument();
  });
});
