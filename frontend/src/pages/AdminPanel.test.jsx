import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPanel from './AdminPanel';

const {
  dashboard,
  reportSummary,
  reviews,
  bookings,
  customers,
  auditLogs,
  inventory,
  updateInventoryStatus,
  payments,
  initiateRefund,
  deleteCustomer,
  products,
  product,
  categories,
  createVariant,
} = vi.hoisted(() => ({
  dashboard: vi.fn(),
  reportSummary: vi.fn(),
  reviews: vi.fn(),
  bookings: vi.fn(),
  customers: vi.fn(),
  auditLogs: vi.fn(),
  inventory: vi.fn(),
  updateInventoryStatus: vi.fn(),
  payments: vi.fn(),
  initiateRefund: vi.fn(),
  deleteCustomer: vi.fn(),
  products: vi.fn(),
  product: vi.fn(),
  categories: vi.fn(),
  createVariant: vi.fn(),
}));

vi.mock('../context api/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'admin-id', name: 'WardroWave Admin' }, logout: vi.fn() }),
}));

vi.mock('../context api/theme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../lib/api/api', () => ({
  default: {
    admin: {
      dashboard,
      reportSummary,
      reviews,
      bookings,
      customers,
      auditLogs,
      inventory,
      updateInventoryStatus,
      payments,
      initiateRefund,
      deleteCustomer,
      products,
      product,
      categories,
      createVariant,
    },
    staff: { markUnitClean: vi.fn() },
  },
}));

function renderAdmin(initialEntries = ['/admin']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AdminPanel />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboard.mockResolvedValue({
      data: {
        bookings: { total: 14, pendingPayment: 2, active: 5 },
        customers: { active: 9 },
        products: { total: 12, drafts: 3 },
        inventory: { total: 30, available: 21 },
        pendingReviews: 4,
        recentBookings: [],
      },
    });
    reportSummary.mockResolvedValue({
      data: {
        period: { from: '2026-01-01', to: '2026-01-30' },
        bookings: [{ status: 'completed', count: 2, bookingValue: 50_000 }],
        payments: { capturedCount: 2, capturedAmount: 50_000, refundedAmount: 10_000, netAmount: 40_000 },
        inventory: [{ status: 'available', count: 3 }],
      },
    });
    reviews.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, pages: 0 } });
    bookings.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, pages: 0 } });
    customers.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, pages: 0 } });
    auditLogs.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, pages: 0 } });
    inventory.mockResolvedValue({
      data: [{
        _id: 'unit-id',
        unitCode: 'WW-001',
        status: 'available',
        condition: 'good',
        rentCount: 1,
        maxRentCount: 20,
        product: { title: 'Test dress' },
        variant: { size: 'M', color: 'Blue' },
      }],
      meta: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    updateInventoryStatus.mockResolvedValue({ data: { status: 'retired' } });
    payments.mockResolvedValue({
      data: [{
        _id: 'payment-id',
        booking: { bookingNumber: 'WW-1001', status: 'confirmed' },
        user: { name: 'Customer Example', email: 'customer@example.test' },
        razorpayOrderId: 'order-1001',
        razorpayPaymentId: 'payment-1001',
        amount: 10_000,
        refundedAmount: 0,
        refundReservedAmount: 0,
        refundableAmount: 10_000,
        currency: 'INR',
        status: 'captured',
        method: 'card',
        createdAt: '2026-01-30T00:00:00.000Z',
        refunds: [],
      }],
      meta: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    initiateRefund.mockResolvedValue({ data: { refund: { status: 'pending' } } });
    deleteCustomer.mockResolvedValue({ data: { deleted: true } });
    products.mockResolvedValue({
      data: [{
        _id: 'product-id',
        title: 'Test dress',
        slug: 'test-dress',
        category: { name: 'Dresses' },
        status: 'draft',
        pricing: { basePrice: 10_000 },
        images: [{ url: 'https://example.test/dress.jpg' }],
      }],
      meta: { page: 1, limit: 20, total: 1, pages: 1 },
    });
    product.mockResolvedValue({
      data: {
        _id: 'product-id',
        title: 'Test dress',
        variants: [],
        inventory: [],
      },
    });
    categories.mockResolvedValue({ data: [], meta: { page: 1, limit: 100, total: 0, pages: 0 } });
    createVariant.mockResolvedValue({ data: { variant: { _id: 'variant-id' }, units: [] } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows dashboard metrics and navigation for admin workflows', async () => {
    renderAdmin();

    expect(await screen.findByText('Total bookings')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(await screen.findByText('Net collected')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Admin sections' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reviews' }));
    expect(screen.getByRole('heading', { name: 'Reviews' })).toBeInTheDocument();
  });

  it('supports direct admin section routes and submits a confirmed refund', async () => {
    renderAdmin(['/admin/payments']);

    expect(await screen.findByRole('heading', { name: 'Payments' })).toBeInTheDocument();
    expect(await screen.findByText('WW-1001')).toBeInTheDocument();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Refund' }));
    fireEvent.change(screen.getByLabelText('Amount (₹)'), { target: { value: '50.00' } });
    fireEvent.change(screen.getByLabelText('Reason / audit note'), {
      target: { value: 'Customer support goodwill adjustment' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm refund' }));

    await waitFor(() => {
      expect(initiateRefund).toHaveBeenCalledWith('payment-id', {
        amount: 5_000,
        notes: 'Customer support goodwill adjustment',
      });
    });
  });

  it('filters operations reports by date and exports the selected range', async () => {
    renderAdmin();

    fireEvent.change(await screen.findByLabelText('Report start date'), {
      target: { value: '2026-01-01' },
    });

    fireEvent.change(screen.getByLabelText('Report end date'), {
      target: { value: '2026-01-30' },
    });
    await waitFor(() => {
      expect(reportSummary).toHaveBeenLastCalledWith('2026-01-01', '2026-01-30');
      expect(screen.getByRole('button', { name: 'Export report' })).toBeEnabled();
    });
    const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    const createObjectURL = vi.fn(() => 'blob:admin-report');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
      expect(this.download).toBe('wardrowave-report-2026-01-01-to-2026-01-30.csv');
    });

    try {
      fireEvent.click(screen.getByRole('button', { name: 'Export report' }));

      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:admin-report');
    } finally {
      clickSpy.mockRestore();
      if (originalCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
      else delete URL.createObjectURL;
      if (originalRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
      else delete URL.revokeObjectURL;
    }
  });

  it('creates a size variant with physical unit codes from the catalog', async () => {
    renderAdmin(['/admin/products']);

    fireEvent.click(await screen.findByRole('button', { name: 'Sizes & stock' }));
    fireEvent.change(await screen.findByPlaceholderText('SKU (e.g. DRESS-M-BLK)'), {
      target: { value: 'DRESS-M-BLK' },
    });
    fireEvent.change(screen.getByPlaceholderText('Size (e.g. M)'), { target: { value: 'M' } });
    fireEvent.change(screen.getByPlaceholderText('Color'), { target: { value: 'Black' } });
    fireEvent.change(screen.getByPlaceholderText(/Physical unit codes/), {
      target: { value: 'DRESS-M-001\nDRESS-M-002' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add size and stock' }));

    await waitFor(() => {
      expect(createVariant).toHaveBeenCalledWith('product-id', {
        sku: 'DRESS-M-BLK',
        size: 'M',
        color: 'Black',
        unitCodes: ['DRESS-M-001', 'DRESS-M-002'],
      });
    });
  });

  it('filters bookings by status and date range', async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'Orders' }));
    fireEvent.change(await screen.findByRole('combobox', { name: 'Filter bookings by status' }), {
      target: { value: 'completed' },
    });
    fireEvent.change(screen.getByLabelText('Bookings start date'), {
      target: { value: '2026-02-01' },
    });
    fireEvent.change(screen.getByLabelText('Bookings end date'), {
      target: { value: '2026-02-28' },
    });
    await waitFor(() => {
      expect(bookings).toHaveBeenLastCalledWith(expect.objectContaining({
        status: 'completed',
        from: '2026-02-01',
        to: '2026-02-28',
      }));
    });
  });

  it('filters user access management by role and account status', async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'Users' }));
    fireEvent.change(await screen.findByRole('combobox', { name: 'Filter users by role' }), {
      target: { value: 'staff' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter users by status' }), {
      target: { value: 'blocked' },
    });
    await waitFor(() => {
      expect(customers).toHaveBeenLastCalledWith(expect.objectContaining({
        role: 'staff',
        status: 'blocked',
      }));
    });
  });

  it('filters audit history by entity, actor, and date', async () => {
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'Audit trail' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Filter audit by entity type' }), {
      target: { value: 'Booking' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Filter audit by actor ID' }), {
      target: { value: '0123456789abcdef01234567' },
    });
    fireEvent.change(screen.getByLabelText('Audit start date'), {
      target: { value: '2026-03-01' },
    });
    fireEvent.change(screen.getByLabelText('Audit end date'), {
      target: { value: '2026-03-31' },
    });
    await waitFor(() => {
      expect(auditLogs).toHaveBeenLastCalledWith(expect.objectContaining({
        entityType: 'Booking',
        actorId: '0123456789abcdef01234567',
        from: '2026-03-01',
        to: '2026-03-31',
      }));
    });
  });

  it('requires confirmation before retiring an inventory unit', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: 'Inventory' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Retire' }));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('WW-001'));
    await waitFor(() => expect(updateInventoryStatus).toHaveBeenCalledWith('unit-id', 'retired'));
    confirmSpy.mockRestore();
  });
});
