import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Archive,
  BadgePercent,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  PackageCheck,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context api/AuthContext';
import { useTheme } from '../context api/theme';
import api from '../lib/api/api';

const navigation = [
  { path: 'dashboard', id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'users', id: 'customers', label: 'Users', icon: Users },
  { path: 'products', id: 'catalog', label: 'Products', icon: Package },
  { path: 'orders', id: 'bookings', label: 'Orders', icon: ClipboardList },
  { path: 'rentals', id: 'bookings', label: 'Rentals', icon: PackageCheck },
  { path: 'payments', id: 'payments', label: 'Payments', icon: CreditCard },
  { path: 'settings', id: 'settings', label: 'Settings', icon: Settings },
  { path: 'inventory', id: 'inventory', label: 'Inventory', icon: Boxes },
  { path: 'coupons', id: 'coupons', label: 'Coupons', icon: BadgePercent },
  { path: 'reviews', id: 'reviews', label: 'Reviews', icon: Star },
  { path: 'audit', id: 'audit', label: 'Audit trail', icon: ShieldCheck },
];

const sectionByPath = Object.fromEntries(navigation.map(({ path, id }) => [path, id]));

const surface = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50';
const subtleButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-purple-300 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50';

function formatMoney(value = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) / 100);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : '—';
}

function formatLocalDateTime(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function defaultReportRange() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function downloadCsv(filename, headers, rows) {
  const escapeCell = (value) => {
    const text = String(value ?? '');
    const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
  };
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function statusClass(status) {
  if (['approved', 'active', 'available', 'published', 'completed', 'returned'].includes(status)) {
    return 'admin-status-success';
  }
  if (['pending', 'pending_payment', 'draft', 'maintenance', 'return_requested'].includes(status)) {
    return 'admin-status-pending';
  }
  if (['rejected', 'blocked', 'inactive', 'cancelled', 'archived', 'retired', 'payment_failed'].includes(status)) {
    return 'admin-status-danger';
  }
  return 'admin-status-neutral';
}

function StatusBadge({ value }) {
  return (
    <span className={`admin-status-badge ${statusClass(value)}`}>
      {String(value || 'unknown').replaceAll('_', ' ')}
    </span>
  );
}

function PageTitle({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function QueryState({ query, empty = 'No records found.' }) {
  if (query.isPending) {
    return <div className={`${surface} p-8 text-center text-sm text-slate-500`}>Loading admin data…</div>;
  }
  if (query.isError) {
    return (
      <div className={`${surface} p-6`} role="alert">
        <p className="font-semibold text-rose-700">Could not load this section.</p>
        <p className="mt-1 text-sm text-slate-600">{query.error?.message || 'Please try again.'}</p>
        <button type="button" className={`${subtleButtonClass} mt-4`} onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );
  }
  if (!query.data?.data?.length) {
    return <div className={`${surface} p-8 text-center text-sm text-slate-500`}>{empty}</div>;
  }
  return null;
}

function Pagination({ result, page, setPage }) {
  const total = Number(result?.meta?.total ?? 0);
  const pages = Math.max(1, Number(result?.meta?.pages ?? 1));
  const currentPage = Number(result?.meta?.page ?? page);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>{total} record{total === 1 ? '' : 's'} · Page {currentPage} of {pages}</span>
      <div className="flex gap-2">
        <button
          type="button"
          className={subtleButtonClass}
          aria-label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => setPage(currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className={subtleButtonClass}
          aria-label="Next page"
          disabled={currentPage >= pages}
          onClick={() => setPage(currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function TableFrame({ children, result, page, setPage }) {
  return (
    <div className={`${surface} overflow-hidden`}>
      <div className="overflow-x-auto">{children}</div>
      <Pagination result={result} page={page} setPage={setPage} />
    </div>
  );
}

function Table({ headings, children }) {
  return (
    <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>{headings.map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">{heading}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-gray-700">{children}</tbody>
    </table>
  );
}

function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className={`${inputClass} pl-9`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}

function useAdminMutation(mutationFn, queryKeys = [['admin']]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Changes saved.');
    },
    onError: (error) => toast.error(error.message || 'The change could not be saved.'),
  });
}

function OverviewPanel() {
  const [reportRange, setReportRange] = useState(defaultReportRange);
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: api.admin.dashboard });
  const validReportRange = reportRange.from && reportRange.to && reportRange.from <= reportRange.to;
  const report = useQuery({
    queryKey: ['admin', 'report', reportRange.from, reportRange.to],
    queryFn: () => api.admin.reportSummary(reportRange.from, reportRange.to),
    enabled: Boolean(validReportRange),
  });
  const data = query.data?.data;
  const metrics = [
    { label: 'Total bookings', value: data?.bookings.total, detail: `${data?.bookings.pendingPayment ?? 0} awaiting payment`, icon: ClipboardList },
    { label: 'Active customers', value: data?.customers.active, detail: 'Customer accounts', icon: Users },
    { label: 'Catalog products', value: data?.products.total, detail: `${data?.products.drafts ?? 0} drafts`, icon: Package },
    { label: 'Available units', value: data?.inventory.available, detail: `${data?.inventory.total ?? 0} total units`, icon: Boxes },
    { label: 'Active rentals', value: data?.bookings.active, detail: 'In fulfillment', icon: PackageCheck },
    { label: 'Pending reviews', value: data?.pendingReviews, detail: 'Waiting for moderation', icon: Star },
    { label: 'Net collected', value: report.data?.data?.payments.netAmount, detail: `${reportRange.from} to ${reportRange.to} · after recorded refunds`, icon: BadgePercent, money: true },
  ];

  if (query.isPending || query.isError) return <QueryState query={query} />;
  return (
    <>
      <PageTitle title="Overview" description="A snapshot of your WardroWave rental operation." />
      <section className={`${surface} mb-5 flex flex-wrap items-end justify-between gap-4 p-4`}>
        <div>
          <h2 className="font-semibold text-slate-900">Operations report</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a date range for booking and payment totals; inventory is a current snapshot.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-600">From
            <input className={`${inputClass} mt-1 block sm:w-40`} type="date" aria-label="Report start date" value={reportRange.from} max={reportRange.to} onChange={(event) => setReportRange({ ...reportRange, from: event.target.value })} />
          </label>
          <label className="text-xs font-medium text-slate-600">To
            <input className={`${inputClass} mt-1 block sm:w-40`} type="date" aria-label="Report end date" value={reportRange.to} min={reportRange.from} onChange={(event) => setReportRange({ ...reportRange, to: event.target.value })} />
          </label>
          <button
            type="button"
            className={subtleButtonClass}
            disabled={!report.data?.data}
            onClick={() => {
              const { bookings, payments, inventory, period } = report.data.data;
              downloadCsv(`wardrowave-report-${period.from}-to-${period.to}.csv`,
                ['Category', 'Status', 'Count', 'Amount (INR)'],
                [
                  ...bookings.map((item) => ['Bookings', item.status, item.count, (item.bookingValue / 100).toFixed(2)]),
                  ['Payments', 'Captured', payments.capturedCount, (payments.capturedAmount / 100).toFixed(2)],
                  ['Payments', 'Refunded', '', (payments.refundedAmount / 100).toFixed(2)],
                  ['Payments', 'Net collected', '', (payments.netAmount / 100).toFixed(2)],
                  ...inventory.map((item) => ['Current inventory', item.status, item.count, '']),
                ]);
            }}
          >
            Export report
          </button>
        </div>
        {!validReportRange && <p className="w-full text-sm text-rose-700" role="alert">Choose a valid date range.</p>}
        {report.isError && <p className="w-full text-sm text-rose-700" role="alert">Financial summary unavailable: {report.error?.message}</p>}
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, detail, icon: Icon, money }) => (
          <article key={label} className={`${surface} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{value === undefined ? '—' : money ? formatMoney(value) : value}</p>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
              </div>
              <span className="rounded-xl bg-purple-50 p-3 text-purple-700"><Icon size={20} /></span>
            </div>
          </article>
        ))}
      </div>
      <section className={`${surface} mt-6 overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent bookings</h2>
        </div>
        {!data?.recentBookings?.length ? (
          <p className="p-6 text-sm text-slate-500">No bookings yet.</p>
        ) : (
          <Table headings={['Booking', 'Customer', 'Status', 'Total', 'Created']}>
            {data.recentBookings.map((booking) => (
              <tr key={booking._id}>
                <td className="whitespace-nowrap px-4 py-3 font-medium">{booking.bookingNumber}</td>
                <td className="px-4 py-3">{booking.user?.name || booking.user?.email || '—'}</td>
                <td className="px-4 py-3"><StatusBadge value={booking.status} /></td>
                <td className="whitespace-nowrap px-4 py-3">{formatMoney(booking.pricing?.grandTotal)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(booking.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </>
  );
}

function BookingsPanel({ title = 'Orders' }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedId, setSelectedId] = useState('');
  const validDateRange = !dateRange.from || !dateRange.to || dateRange.from <= dateRange.to;
  const query = useQuery({
    queryKey: ['admin', 'bookings', page, q, status, dateRange.from, dateRange.to],
    queryFn: () => api.admin.bookings({
      page,
      limit: 20,
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
      ...(dateRange.from ? { from: dateRange.from } : {}),
      ...(dateRange.to ? { to: dateRange.to } : {}),
    }),
    enabled: validDateRange,
  });
  const detail = useQuery({
    queryKey: ['admin', 'booking', selectedId],
    queryFn: () => api.admin.booking(selectedId),
    enabled: Boolean(selectedId),
  });
  const dispatch = useAdminMutation(({ id, data }) => api.staff.dispatch(id, data));
  const deliver = useAdminMutation(api.staff.deliver);
  const receiveReturn = useAdminMutation(({ id, data }) => api.staff.receiveReturn(id, data));
  const inspectReturn = useAdminMutation(({ id, data }) => api.staff.inspectReturn(id, data));
  const [tracking, setTracking] = useState({ carrier: '', trackingNumber: '' });
  return (
    <>
      <PageTitle title={title} description="Search bookings and inspect rental and fulfillment details." />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBox value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search booking number…" />
        <select className={`${inputClass} sm:max-w-xs`} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter bookings by status">
          <option value="">All statuses</option>
          {['pending_payment', 'confirmed', 'partially_dispatched', 'dispatched', 'delivered', 'return_requested', 'returned', 'completed', 'cancelled', 'payment_failed', 'expired'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
        </select>
        <label className="text-xs font-medium text-slate-600">From
          <input className={`${inputClass} mt-1 block sm:w-40`} type="date" aria-label="Bookings start date" max={dateRange.to || undefined} value={dateRange.from} onChange={(event) => { setDateRange({ ...dateRange, from: event.target.value }); setPage(1); }} />
        </label>
        <label className="text-xs font-medium text-slate-600">To
          <input className={`${inputClass} mt-1 block sm:w-40`} type="date" aria-label="Bookings end date" min={dateRange.from || undefined} value={dateRange.to} onChange={(event) => { setDateRange({ ...dateRange, to: event.target.value }); setPage(1); }} />
        </label>
      </div>
      {dateRange.from && dateRange.to && dateRange.from > dateRange.to && <p className="mb-4 text-sm text-rose-700" role="alert">The start date must not follow the end date.</p>}
      {!validDateRange ? null : query.isPending || query.isError || !query.data?.data?.length ? (
        <QueryState query={query} empty="No bookings match these filters." />
      ) : (
        <TableFrame result={query.data} page={page} setPage={setPage}>
          <Table headings={['Booking', 'Customer', 'Items', 'Status', 'Payment', 'Total', 'Date', '']}>
            {query.data.data.map((booking) => (
              <tr key={booking._id}>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{booking.bookingNumber}</td>
                <td className="px-4 py-3">{booking.user?.name || booking.user?.email || '—'}</td>
                <td className="max-w-48 truncate px-4 py-3">{booking.items?.map((item) => item.titleSnapshot).join(', ')}</td>
                <td className="px-4 py-3"><StatusBadge value={booking.status} /></td>
                <td className="px-4 py-3">{booking.payment?.status || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatMoney(booking.pricing.grandTotal)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(booking.createdAt)}</td>
                <td className="px-4 py-3"><button type="button" className={subtleButtonClass} onClick={() => setSelectedId(booking._id)}>Details</button></td>
              </tr>
            ))}
          </Table>
        </TableFrame>
      )}
      {selectedId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(''); }}>
          <section className={`${surface} max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6`} role="dialog" aria-modal="true" aria-label="Booking details">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Booking details</h2>
              <button type="button" className={subtleButtonClass} onClick={() => setSelectedId('')}>Close</button>
            </div>
            {detail.isPending || detail.isError ? <QueryState query={detail} /> : (
              <div className="mt-5 space-y-4 text-sm">
                <p><span className="font-semibold">Number:</span> {detail.data.data.bookingNumber}</p>
                <p><span className="font-semibold">Customer:</span> {detail.data.data.user?.name} · {detail.data.data.user?.email} · {detail.data.data.user?.phone}</p>
                <p><span className="font-semibold">Status:</span> <StatusBadge value={detail.data.data.status} /></p>
                <p><span className="font-semibold">Payment:</span> {detail.data.data.payment?.status || '—'} · <span className="font-semibold">Total:</span> {formatMoney(detail.data.data.pricing.grandTotal)}</p>
                <div>
                  <h3 className="font-semibold">Items</h3>
                  <ul className="mt-2 space-y-2">{detail.data.data.items?.map((item) => <li key={item._id} className="rounded-xl bg-slate-50 p-3">{item.titleSnapshot} · {item.sizeSnapshot || '—'} · {item.status || 'pending'}</li>)}</ul>
                </div>
                <div>
                  <h3 className="font-semibold">Fulfillment history</h3>
                  <ul className="mt-2 space-y-2">{detail.data.data.timeline?.map((event, index) => <li key={`${event.status}-${event.at}-${index}`} className="rounded-xl bg-slate-50 p-3">{event.status} · {formatDate(event.at)} · {event.note || ''}</li>)}</ul>
                </div>
                {detail.data.data.status === 'confirmed' && (
                  <form className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => {
                    event.preventDefault();
                    dispatch.mutate({ id: selectedId, data: tracking }, {
                      onSuccess: () => setTracking({ carrier: '', trackingNumber: '' }),
                    });
                  }}>
                    <input className={inputClass} required maxLength={100} placeholder="Outbound carrier" value={tracking.carrier} onChange={(event) => setTracking({ ...tracking, carrier: event.target.value })} />
                    <input className={inputClass} required maxLength={150} placeholder="Tracking number" value={tracking.trackingNumber} onChange={(event) => setTracking({ ...tracking, trackingNumber: event.target.value })} />
                    <button type="submit" className={buttonClass} disabled={dispatch.isPending}>Dispatch</button>
                  </form>
                )}
                {detail.data.data.status === 'dispatched' && (
                  <button type="button" className={buttonClass} disabled={deliver.isPending} onClick={() => deliver.mutate(selectedId, {
                    onSuccess: () => setTracking({ carrier: '', trackingNumber: '' }),
                  })}>Confirm delivery</button>
                )}
                {detail.data.data.status === 'return_requested' && (
                  <form className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => {
                    event.preventDefault();
                    receiveReturn.mutate({ id: selectedId, data: tracking }, {
                      onSuccess: () => setTracking({ carrier: '', trackingNumber: '' }),
                    });
                  }}>
                    <input className={inputClass} required maxLength={100} placeholder="Return carrier" value={tracking.carrier} onChange={(event) => setTracking({ ...tracking, carrier: event.target.value })} />
                    <input className={inputClass} required maxLength={150} placeholder="Return tracking number" value={tracking.trackingNumber} onChange={(event) => setTracking({ ...tracking, trackingNumber: event.target.value })} />
                    <button type="submit" className={buttonClass} disabled={receiveReturn.isPending}>Receive return</button>
                  </form>
                )}
                {detail.data.data.status === 'returned' && (
                  <ReturnInspectionForm
                    booking={detail.data.data}
                    pending={inspectReturn.isPending}
                    onSubmit={(items) => inspectReturn.mutate({ id: selectedId, data: { items } })}
                  />
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function ReturnInspectionForm({ booking, pending, onSubmit }) {
  const [assessments, setAssessments] = useState(() => Object.fromEntries(
    (booking.items || []).map((item) => [item._id, { damageLevel: 'none', damageCharge: '', notes: '' }]),
  ));
  return (
    <form className="space-y-3 rounded-xl bg-slate-50 p-4" onSubmit={(event) => {
      event.preventDefault();
      onSubmit((booking.items || []).map((item) => {
        const assessment = assessments[item._id] || { damageLevel: 'none', damageCharge: '', notes: '' };
        return {
          itemId: item._id,
          damageLevel: assessment.damageLevel,
          damageCharge: Math.round(Number(assessment.damageCharge || 0) * 100),
          ...(assessment.notes.trim() ? { notes: assessment.notes.trim() } : {}),
          photos: [],
        };
      }));
    }}>
      <h3 className="font-semibold text-slate-900">Inspect returned items</h3>
      {(booking.items || []).map((item) => (
        <fieldset key={item._id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-3">
          <legend className="px-1 text-sm font-medium">{item.titleSnapshot}</legend>
          <select
            className={inputClass}
            aria-label={`Damage level for ${item.titleSnapshot}`}
            value={assessments[item._id]?.damageLevel || 'none'}
            onChange={(event) => setAssessments({
              ...assessments,
              [item._id]: { ...assessments[item._id], damageLevel: event.target.value },
            })}
          >
            {['none', 'minor', 'major', 'lost'].map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            aria-label={`Damage charge in rupees for ${item.titleSnapshot}`}
            placeholder="Damage charge (₹)"
            value={assessments[item._id]?.damageCharge ?? ''}
            onChange={(event) => setAssessments({
              ...assessments,
              [item._id]: { ...assessments[item._id], damageCharge: event.target.value },
            })}
          />
          <input
            className={`${inputClass} sm:col-span-3`}
            maxLength={2000}
            aria-label={`Inspection notes for ${item.titleSnapshot}`}
            placeholder="Inspection notes"
            value={assessments[item._id]?.notes || ''}
            onChange={(event) => setAssessments({
              ...assessments,
              [item._id]: { ...assessments[item._id], notes: event.target.value },
            })}
          />
        </fieldset>
      ))}
      <button type="submit" className={buttonClass} disabled={pending || !booking.items?.length}>Complete inspection</button>
    </form>
  );
}

function CustomersPanel({ currentUserId, currentUserRole }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'customers', page, q, role, status],
    queryFn: () => api.admin.customers({
      page,
      limit: 20,
      ...(q ? { q } : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    }),
  });
  const accessMutation = useAdminMutation(
    ({ id, data }) => api.admin.updateUserAccess(id, data),
    [['admin', 'customers']],
  );
  const deleteCustomer = useAdminMutation(
    api.admin.deleteCustomer,
    [['admin', 'customers'], ['admin', 'audit']],
  );
  const detail = useQuery({
    queryKey: ['admin', 'customer', selectedId],
    queryFn: () => api.admin.customer(selectedId),
    enabled: Boolean(selectedId),
  });
  return (
    <>
      <PageTitle title="Users" description="Review accounts, manage access, or anonymize a customer account." />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBox value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search name, email, or phone…" />
        <select className={`${inputClass} sm:max-w-xs`} value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} aria-label="Filter users by role">
          <option value="">All roles</option>
          {['customer', 'staff', 'admin', 'superadmin'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select className={`${inputClass} sm:max-w-xs`} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter users by status">
          <option value="">All account statuses</option>
          {['active', 'blocked'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      {query.isPending || query.isError || !query.data?.data?.length ? (
        <QueryState query={query} empty="No matching accounts found." />
      ) : (
        <TableFrame result={query.data} page={page} setPage={setPage}>
          <Table headings={['User', 'Contact', 'Role', 'Status', 'Joined', 'Access']}>
            {query.data.data.map((customer) => (
              <tr key={customer._id}>
                <td className="px-4 py-3">
                  <button type="button" className="text-left font-semibold text-purple-700 hover:underline" onClick={() => setSelectedId(customer._id)}>{customer.name}</button>
                  <p className="text-xs text-slate-500">{customer.emailVerified ? 'Verified email' : 'Email not verified'}</p>
                </td>
                <td className="px-4 py-3">{customer.email}<br /><span className="text-xs text-slate-500">{customer.phone || 'No phone'}</span></td>
                <td className="px-4 py-3">
                  <select
                    className={`${inputClass} min-w-32`}
                    aria-label={`Role for ${customer.name}`}
                    value={customer.role}
                    disabled={accessMutation.isPending || customer._id === currentUserId || currentUserRole !== 'superadmin'}
                    title={currentUserRole === 'superadmin' ? undefined : 'Only a superadministrator can change roles'}
                    onChange={(event) => accessMutation.mutate({ id: customer._id, data: { role: event.target.value } })}
                  >
                    {['customer', 'staff', 'admin', 'superadmin'].map((role) => <option key={role} value={role} disabled={['admin', 'superadmin'].includes(role) && !customer.emailVerified}>{role}{['admin', 'superadmin'].includes(role) && !customer.emailVerified ? ' (verified email required)' : ''}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3"><StatusBadge value={customer.status} /></td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(customer.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className={subtleButtonClass}
                    disabled={accessMutation.isPending
                      || customer._id === currentUserId
                      || (['admin', 'superadmin'].includes(customer.role) && currentUserRole !== 'superadmin')}
                    onClick={() => accessMutation.mutate({
                      id: customer._id,
                      data: { status: customer.status === 'active' ? 'blocked' : 'active' },
                    })}
                  >
                    {customer.status === 'active' ? 'Block' : 'Unblock'}
                  </button>
                  {customer.role === 'customer' && (
                    <button
                      type="button"
                      className={`${subtleButtonClass} ml-2 text-rose-700`}
                      disabled={deleteCustomer.isPending}
                      onClick={() => {
                        if (window.confirm(
                          `Permanently anonymize ${customer.name}'s account? This cannot be undone and is unavailable while they have active bookings.`,
                        )) {
                          deleteCustomer.mutate(customer._id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </TableFrame>
      )}
      {selectedId && (
        <div className="mt-5">
          <section className={`${surface} p-5`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Customer account</h2>
              <button type="button" className={subtleButtonClass} onClick={() => setSelectedId('')}>Close</button>
            </div>
            {detail.isPending ? <p className="mt-4 text-sm text-slate-500">Loading customer…</p> : detail.isError ? <p role="alert" className="mt-4 text-sm text-rose-700">{detail.error.message}</p> : (
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <p><b>Name:</b> {detail.data.data.name}</p>
                <p><b>Email:</b> {detail.data.data.email || '—'}</p>
                <p><b>Phone:</b> {detail.data.data.phone || '—'}</p>
                <p><b>Bookings:</b> {detail.data.data.bookingCount}</p>
                <div className="sm:col-span-2"><b>Saved addresses:</b> {detail.data.data.addresses?.map((address) => `${address.fullName}, ${address.city} ${address.pincode}`).join(' · ') || 'None'}</div>
                <div className="sm:col-span-2"><b>Recent bookings:</b> {detail.data.data.recentBookings?.map((booking) => `${booking.bookingNumber} (${booking.status})`).join(' · ') || 'None'}</div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function PaymentsPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundForm, setRefundForm] = useState({ amount: '', notes: '' });
  const query = useQuery({
    queryKey: ['admin', 'payments', page, q, status],
    queryFn: () => api.admin.payments({
      page,
      limit: 20,
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
    }),
  });
  const refund = useAdminMutation(
    ({ id, data }) => api.admin.initiateRefund(id, data),
    [['admin', 'payments'], ['admin', 'audit']],
  );
  const submitRefund = (event) => {
    event.preventDefault();
    const amount = Math.round(Number(refundForm.amount) * 100);
    if (!selectedPayment || !Number.isSafeInteger(amount) || amount <= 0) {
      toast.error('Enter a valid refund amount.');
      return;
    }
    if (amount > selectedPayment.refundableAmount) {
      toast.error('Refund amount exceeds the remaining refundable balance.');
      return;
    }
    if (!window.confirm(`Initiate a refund of ${formatMoney(amount)} for ${selectedPayment.booking?.bookingNumber || 'this payment'}?`)) {
      return;
    }
    refund.mutate({ id: selectedPayment._id, data: { amount, notes: refundForm.notes.trim() } }, {
      onSuccess: () => {
        setSelectedPayment(null);
        setRefundForm({ amount: '', notes: '' });
      },
    });
  };
  return (
    <>
      <PageTitle title="Payments" description="Review payment status and initiate audited, recent-auth refunds." />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBox value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search booking, order, or payment ID…" />
        <select className={`${inputClass} sm:max-w-xs`} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter payments by status">
          <option value="">All payment statuses</option>
          {['created', 'authorized', 'captured', 'partially_refunded', 'refunded', 'failed'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
        </select>
      </div>
      {query.isPending || query.isError || !query.data?.data?.length ? (
        <QueryState query={query} empty="No payments match these filters." />
      ) : (
        <TableFrame result={query.data} page={page} setPage={setPage}>
          <Table headings={['Booking', 'Customer', 'Payment', 'Method', 'Amount', 'Refunded', 'Status', 'Date', '']}>
            {query.data.data.map((payment) => (
              <tr key={payment._id}>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{payment.booking?.bookingNumber || '—'}</td>
                <td className="px-4 py-3">{payment.user?.name || payment.user?.email || '—'}</td>
                <td className="max-w-40 truncate px-4 py-3 text-xs" title={payment.razorpayPaymentId || payment.razorpayOrderId}>
                  {payment.razorpayPaymentId || payment.razorpayOrderId}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{payment.method || payment.cardNetwork || payment.bank || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatMoney(payment.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatMoney(payment.refundedAmount)}{payment.refundReservedAmount > 0 && <span className="block text-xs text-slate-500">{formatMoney(payment.refundReservedAmount)} pending</span>}</td>
                <td className="px-4 py-3"><StatusBadge value={payment.status} /></td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(payment.paidAt || payment.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {payment.refundableAmount > 0 && payment.razorpayPaymentId && ['captured', 'partially_refunded'].includes(payment.status) && (
                    <button
                      type="button"
                      className={subtleButtonClass}
                      onClick={() => {
                        setSelectedPayment(payment);
                        setRefundForm({ amount: (payment.refundableAmount / 100).toFixed(2), notes: '' });
                      }}
                    >
                      Refund
                    </button>
                  )}
                  {payment.refunds?.map((entry) => (
                    <span key={entry._id} className="ml-2 inline-flex"><StatusBadge value={entry.status} /></span>
                  ))}
                </td>
              </tr>
            ))}
          </Table>
        </TableFrame>
      )}
      {selectedPayment && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4">
          <form className={`${surface} w-full max-w-lg space-y-4 p-6`} onSubmit={submitRefund}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Initiate payment refund</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedPayment.booking?.bookingNumber} · Remaining {formatMoney(selectedPayment.refundableAmount)}</p>
              </div>
              <button type="button" className={subtleButtonClass} onClick={() => setSelectedPayment(null)}>Close</button>
            </div>
            <label className="block text-sm font-medium text-slate-700">Amount (₹)
              <input
                className={`${inputClass} mt-1.5`}
                type="number"
                min="0.01"
                max={(selectedPayment.refundableAmount / 100).toFixed(2)}
                step="0.01"
                required
                value={refundForm.amount}
                onChange={(event) => setRefundForm({ ...refundForm, amount: event.target.value })}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">Reason / audit note
              <textarea
                className={`${inputClass} mt-1.5`}
                rows={3}
                maxLength={500}
                required
                value={refundForm.notes}
                onChange={(event) => setRefundForm({ ...refundForm, notes: event.target.value })}
              />
            </label>
            <p className="text-xs text-slate-500">The server verifies the refundable balance, records the admin action, and submits the refund to Razorpay.</p>
            <button type="submit" className={buttonClass} disabled={refund.isPending}>
              {refund.isPending ? 'Submitting…' : 'Confirm refund'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function CatalogPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();
  const products = useQuery({
    queryKey: ['admin', 'products', page, q, status],
    queryFn: () => api.admin.products({ page, limit: 20, ...(q ? { q } : {}), ...(status ? { status } : {}) }),
  });
  const categories = useQuery({
    queryKey: ['admin', 'categories', 'all'],
    queryFn: () => api.admin.categories({ limit: 100 }),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
  };
  const createProduct = useAdminMutation(api.admin.createProduct);
  const createCategory = useAdminMutation(api.admin.createCategory);
  const updateCategory = useAdminMutation(({ id, data }) => api.admin.updateCategory(id, data));
  const updateProduct = useAdminMutation(({ id, data }) => api.admin.updateProduct(id, data));
  const createVariant = useAdminMutation(({ id, data }) => api.admin.createVariant(id, data));
  const archiveProduct = useAdminMutation(api.admin.archiveProduct);
  const [productForm, setProductForm] = useState({ title: '', description: '', category: '', gender: 'unisex', imageUrl: '', basePrice: '', extraDayPrice: '', securityDeposit: '' });
  const [categoryName, setCategoryName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [variantForm, setVariantForm] = useState({ sku: '', size: '', color: '', unitCodes: '' });
  const selectedProduct = useQuery({
    queryKey: ['admin', 'product', selectedProductId],
    queryFn: () => api.admin.product(selectedProductId),
    enabled: Boolean(selectedProductId),
  });
  const activeCategories = categories.data?.data?.filter((category) => category.isActive) || [];

  const submitProduct = (event) => {
    event.preventDefault();
    const categoryId = productForm.category || activeCategories[0]?._id;
    if (!categoryId) {
      toast.error('Create or select a category before adding a product.');
      return;
    }
    const price = (value) => Math.round(Number(value) * 100);
    createProduct.mutate({
      title: productForm.title.trim(),
      description: productForm.description.trim(),
      category: categoryId,
      gender: productForm.gender,
      ...(productForm.imageUrl.trim()
        ? { images: [{ url: productForm.imageUrl.trim(), isPrimary: true }] }
        : {}),
      pricing: {
        basePrice: price(productForm.basePrice),
        extraDayPrice: price(productForm.extraDayPrice),
        securityDeposit: price(productForm.securityDeposit),
      },
    }, {
      onSuccess: () => {
        refresh();
        setProductForm({ title: '', description: '', category: categoryId, gender: 'unisex', imageUrl: '', basePrice: '', extraDayPrice: '', securityDeposit: '' });
        toast.success('Draft product created.');
      },
    });
  };

  const submitCategory = (event) => {
    event.preventDefault();
    createCategory.mutate({ name: categoryName.trim() }, {
      onSuccess: () => { refresh(); setCategoryName(''); },
    });
  };

  const submitVariant = (event) => {
    event.preventDefault();
    const unitCodes = variantForm.unitCodes.split(/[\n,]+/).map((code) => code.trim()).filter(Boolean);
    if (unitCodes.length === 0) {
      toast.error('Enter at least one physical inventory unit code.');
      return;
    }
    createVariant.mutate({
      id: selectedProductId,
      data: {
        sku: variantForm.sku.trim(),
        size: variantForm.size.trim(),
        color: variantForm.color.trim(),
        unitCodes,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'product', selectedProductId] });
        refresh();
        setVariantForm({ sku: '', size: '', color: '', unitCodes: '' });
      },
    });
  };

  return (
    <>
      <PageTitle title="Catalog" description="Create products and categories, publish drafts, and archive retired items." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section>
          <div className="mb-4 flex flex-wrap gap-3">
            <SearchBox value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search products…" />
            <select className={`${inputClass} sm:max-w-xs`} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter products by status">
              <option value="">Active catalog</option>
              {['draft', 'published', 'archived'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          {products.isPending || products.isError || !products.data?.data?.length ? <QueryState query={products} empty="No products found." /> : (
            <TableFrame result={products.data} page={page} setPage={setPage}>
              <Table headings={['Product', 'Category', 'Status', 'Price / day', 'Actions']}>
                {products.data.data.map((product) => (
                  <tr key={product._id}>
                    <td className="px-4 py-3 font-semibold">{product.title}<p className="text-xs font-normal text-slate-500">{product.brand || product.slug}</p></td>
                    <td className="px-4 py-3">{typeof product.category === 'object' ? product.category?.name : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge value={product.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3">{formatMoney(product.pricing.basePrice)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {product.status !== 'archived' && (
                        <button type="button" className={`${subtleButtonClass} mr-2`} onClick={() => setSelectedProductId(product._id)}>Sizes &amp; stock</button>
                      )}
                      {product.status === 'draft' && (
                        <button type="button" className={`${subtleButtonClass} mr-2`} title={!product.images?.length ? 'Add an image before publishing' : undefined} disabled={updateProduct.isPending || !product.images?.length} onClick={() => updateProduct.mutate({ id: product._id, data: { status: 'published' } })}>Publish</button>
                      )}
                      {product.status !== 'archived' && (
                        <button type="button" className={subtleButtonClass} disabled={archiveProduct.isPending} onClick={() => archiveProduct.mutate(product._id)}>Archive</button>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            </TableFrame>
          )}
        </section>
        <div className="space-y-5">
          <form className={`${surface} space-y-3 p-5`} onSubmit={submitProduct}>
            <h2 className="font-semibold text-slate-900">Create a draft product</h2>
            <input className={inputClass} required maxLength={200} placeholder="Product title" value={productForm.title} onChange={(event) => setProductForm({ ...productForm, title: event.target.value })} />
            <textarea className={inputClass} required maxLength={20000} rows={3} placeholder="Description" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
            <input className={inputClass} type="url" placeholder="Image URL (optional; HTTPS)" value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} />
            <select className={inputClass} required value={productForm.category || activeCategories[0]?._id || ''} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>
              <option value="">Select category</option>
              {activeCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <select className={inputClass} value={productForm.gender} onChange={(event) => setProductForm({ ...productForm, gender: event.target.value })}>
              {['women', 'men', 'unisex', 'kids'].map((gender) => <option key={gender} value={gender}>{gender}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input className={inputClass} type="number" min="0" step="0.01" required placeholder="Rental price (₹)" value={productForm.basePrice} onChange={(event) => setProductForm({ ...productForm, basePrice: event.target.value })} />
              <input className={inputClass} type="number" min="0" step="0.01" required placeholder="Extra day (₹)" value={productForm.extraDayPrice} onChange={(event) => setProductForm({ ...productForm, extraDayPrice: event.target.value })} />
              <input className={`${inputClass} col-span-2`} type="number" min="0" step="0.01" required placeholder="Security deposit (₹)" value={productForm.securityDeposit} onChange={(event) => setProductForm({ ...productForm, securityDeposit: event.target.value })} />
            </div>
            <button type="submit" className={buttonClass} disabled={createProduct.isPending || categories.isPending}><Plus size={16} />Create draft</button>
          </form>
          {selectedProductId && (
            <section className={`${surface} space-y-3 p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Sizes &amp; physical stock</h2>
                  <p className="text-sm text-slate-600">{selectedProduct.data?.data?.title || 'Loading product…'}</p>
                </div>
                <button type="button" className={subtleButtonClass} onClick={() => setSelectedProductId('')}>Close</button>
              </div>
              {selectedProduct.isError ? <QueryState query={selectedProduct} /> : (
                <>
                  <p className="text-sm text-slate-600">
                    {selectedProduct.data?.data?.variants?.length || 0} size variants ·{' '}
                    {selectedProduct.data?.data?.inventory?.find(({ status: unitStatus }) => unitStatus === 'available')?.count || 0} available units
                  </p>
                  <form className="space-y-3 border-t border-slate-200 pt-3" onSubmit={submitVariant}>
                    <h3 className="text-sm font-semibold text-slate-900">Add a size and its physical units</h3>
                    <input className={inputClass} required maxLength={100} placeholder="SKU (e.g. DRESS-M-BLK)" value={variantForm.sku} onChange={(event) => setVariantForm({ ...variantForm, sku: event.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <input className={inputClass} required maxLength={30} placeholder="Size (e.g. M)" value={variantForm.size} onChange={(event) => setVariantForm({ ...variantForm, size: event.target.value })} />
                      <input className={inputClass} required maxLength={50} placeholder="Color" value={variantForm.color} onChange={(event) => setVariantForm({ ...variantForm, color: event.target.value })} />
                    </div>
                    <textarea className={inputClass} required maxLength={10000} rows={3} placeholder={'Physical unit codes, one per line or comma-separated\nExample: DRESS-M-001'} value={variantForm.unitCodes} onChange={(event) => setVariantForm({ ...variantForm, unitCodes: event.target.value })} />
                    <button type="submit" className={buttonClass} disabled={createVariant.isPending || selectedProduct.isPending}>
                      {createVariant.isPending ? 'Adding stock…' : 'Add size and stock'}
                    </button>
                  </form>
                </>
              )}
            </section>
          )}
          <form className={`${surface} flex gap-2 p-5`} onSubmit={submitCategory}>
            <input className={inputClass} required maxLength={100} placeholder="New category name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            <button type="submit" className={buttonClass} aria-label="Create category" disabled={createCategory.isPending}><Plus size={16} /></button>
          </form>
          {categories.isError && <p className="text-sm text-rose-700" role="alert">Could not load categories: {categories.error.message}</p>}
          {categories.data?.data?.length > 0 && (
            <section className={`${surface} p-4`}>
              <h2 className="mb-3 font-semibold text-slate-900">Categories</h2>
              <ul className="space-y-2">
                {categories.data.data.map((category) => (
                  <li key={category._id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{category.name} <span className="text-xs text-slate-500">({category.isActive ? 'active' : 'inactive'})</span></span>
                    <button type="button" className={subtleButtonClass} disabled={updateCategory.isPending} onClick={() => updateCategory.mutate({ id: category._id, data: { isActive: !category.isActive } })}>{category.isActive ? 'Deactivate' : 'Activate'}</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function InventoryPanel() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'inventory', page, q, status],
    queryFn: () => api.admin.inventory({ page, limit: 20, ...(q ? { q } : {}), ...(status ? { status } : {}) }),
  });
  const update = useAdminMutation(({ id, status: nextStatus }) => api.admin.updateInventoryStatus(id, nextStatus));
  const markClean = useAdminMutation(api.staff.markUnitClean);
  const retire = (unit) => {
    if (window.confirm(`Retire inventory unit ${unit.unitCode}? This cannot be undone here.`)) {
      update.mutate({ id: unit._id, status: 'retired' });
    }
  };
  return (
    <>
      <PageTitle title="Inventory" description="Track physical units and move eligible pieces into or out of maintenance." />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBox value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search unit code…" />
        <select className={`${inputClass} sm:max-w-xs`} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter inventory by status">
          <option value="">All statuses</option>
          {['available', 'reserved', 'rented', 'cleaning', 'maintenance', 'retired'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      {query.isPending || query.isError || !query.data?.data?.length ? <QueryState query={query} empty="No inventory units found." /> : (
        <TableFrame result={query.data} page={page} setPage={setPage}>
          <Table headings={['Unit', 'Product', 'Variant', 'Status', 'Condition', 'Rent count', 'Action']}>
            {query.data.data.map((unit) => (
              <tr key={unit._id}>
                <td className="px-4 py-3 font-mono text-xs">{unit.unitCode}</td>
                <td className="px-4 py-3">{unit.product?.title || '—'}</td>
                <td className="px-4 py-3">{unit.variant?.size} · {unit.variant?.color}</td>
                <td className="px-4 py-3"><StatusBadge value={unit.status} /></td>
                <td className="px-4 py-3">{unit.condition}</td>
                <td className="px-4 py-3">{unit.rentCount} / {unit.maxRentCount}</td>
                <td className="px-4 py-3">
                  {['available', 'maintenance'].includes(unit.status) ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={subtleButtonClass} disabled={update.isPending} onClick={() => update.mutate({ id: unit._id, status: unit.status === 'available' ? 'maintenance' : 'available' })}>
                        {unit.status === 'available' ? 'Set maintenance' : 'Mark available'}
                      </button>
                      <button type="button" className={subtleButtonClass} disabled={update.isPending} onClick={() => retire(unit)}>Retire</button>
                    </div>
                  ) : unit.status === 'cleaning' ? (
                    <button type="button" className={subtleButtonClass} disabled={markClean.isPending} onClick={() => markClean.mutate(unit._id)}>Mark clean</button>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </Table>
        </TableFrame>
      )}
    </>
  );
}

function CouponsPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'coupons', page, q],
    queryFn: () => api.admin.coupons({ page, limit: 20, ...(q ? { q } : {}) }),
  });
  const create = useAdminMutation(api.admin.createCoupon);
  const update = useAdminMutation(({ id, isActive }) => api.admin.updateCoupon(id, { isActive }));
  const [form, setForm] = useState({
    code: '',
    type: 'flat',
    value: '',
    startsAt: '',
    expiresAt: '',
  });
  useEffect(() => {
    const now = new Date();
    setForm((current) => ({
      ...current,
      startsAt: current.startsAt || formatLocalDateTime(now),
      expiresAt: current.expiresAt || formatLocalDateTime(new Date(now.getTime() + 30 * 86_400_000)),
    }));
  }, []);
  const submit = (event) => {
    event.preventDefault();
    create.mutate({
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: form.type === 'flat' ? Math.round(Number(form.value) * 100) : Number(form.value),
      startsAt: new Date(form.startsAt).toISOString(),
      expiresAt: new Date(form.expiresAt).toISOString(),
      minRentalSubtotal: 0,
      perUserLimit: 1,
      applicableCategories: [],
      applicableProducts: [],
      firstBookingOnly: false,
      isActive: true,
    }, { onSuccess: () => setForm({ ...form, code: '', value: '' }) });
  };
  return (
    <>
      <PageTitle title="Coupons" description="Create promotions and control their availability." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section>
          <div className="mb-4"><SearchBox value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search coupon code…" /></div>
          {query.isPending || query.isError || !query.data?.data?.length ? <QueryState query={query} empty="No coupons found." /> : (
            <TableFrame result={query.data} page={page} setPage={setPage}>
              <Table headings={['Code', 'Discount', 'Validity', 'Usage', 'Status', '']}>
                {query.data.data.map((coupon) => (
                  <tr key={coupon._id}>
                    <td className="px-4 py-3 font-mono font-semibold">{coupon.code}</td>
                    <td className="px-4 py-3">{coupon.type === 'percent' ? `${coupon.value}%` : formatMoney(coupon.value)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(coupon.startsAt)} – {formatDate(coupon.expiresAt)}</td>
                    <td className="px-4 py-3">{coupon.usedCount} used · {coupon.reservedCount} reserved</td>
                    <td className="px-4 py-3"><StatusBadge value={coupon.isActive ? 'active' : 'inactive'} /></td>
                    <td className="px-4 py-3"><button type="button" className={subtleButtonClass} disabled={update.isPending} onClick={() => update.mutate({ id: coupon._id, isActive: !coupon.isActive })}>{coupon.isActive ? 'Deactivate' : 'Activate'}</button></td>
                  </tr>
                ))}
              </Table>
            </TableFrame>
          )}
        </section>
        <form className={`${surface} space-y-3 p-5`} onSubmit={submit}>
          <h2 className="font-semibold text-slate-900">Create coupon</h2>
          <input className={inputClass} required minLength={2} maxLength={40} pattern="[A-Za-z0-9_-]+" placeholder="Coupon code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="flat">Flat amount</option><option value="percent">Percent</option></select>
            <input className={inputClass} type="number" min="0" max={form.type === 'percent' ? 100 : undefined} step={form.type === 'flat' ? '0.01' : '1'} required placeholder={form.type === 'percent' ? 'Percent' : 'Amount (₹)'} value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
          </div>
          <label className="block text-xs font-medium text-slate-500">Starts<input className={`${inputClass} mt-1`} type="datetime-local" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label>
          <label className="block text-xs font-medium text-slate-500">Expires<input className={`${inputClass} mt-1`} type="datetime-local" required value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label>
          <button type="submit" className={buttonClass} disabled={create.isPending}><Plus size={16} />Create coupon</button>
        </form>
      </div>
    </>
  );
}

function ReviewsPanel() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const query = useQuery({
    queryKey: ['admin', 'reviews', page, status],
    queryFn: () => api.admin.reviews({ page, limit: 20, status }),
  });
  const moderate = useAdminMutation(({ id, status: nextStatus }) => api.admin.moderateReview(id, nextStatus));
  return (
    <>
      <PageTitle title="Reviews" description="Moderate customer feedback before it appears in the storefront." />
      <div className="mb-4">
        <select className={`${inputClass} sm:max-w-xs`} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter reviews by status">
          {['pending', 'approved', 'rejected'].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      {query.isPending || query.isError || !query.data?.data?.length ? <QueryState query={query} empty="No reviews in this queue." /> : (
        <TableFrame result={query.data} page={page} setPage={setPage}>
          <Table headings={['Review', 'Product', 'Customer', 'Rating', 'Status', 'Actions']}>
            {query.data.data.map((review) => (
              <tr key={review._id}>
                <td className="max-w-sm px-4 py-3"><span className="font-semibold">{review.title}</span><p className="mt-1 line-clamp-2 text-xs text-slate-500">{review.comment}</p></td>
                <td className="px-4 py-3">{review.product?.title || '—'}</td>
                <td className="px-4 py-3">{review.user?.name || review.user?.email || '—'}</td>
                <td className="px-4 py-3">{review.rating} / 5</td>
                <td className="px-4 py-3"><StatusBadge value={review.status} /></td>
                <td className="whitespace-nowrap px-4 py-3">
                  {review.status !== 'approved' && <button type="button" className={`${subtleButtonClass} mr-2`} disabled={moderate.isPending} onClick={() => moderate.mutate({ id: review._id, status: 'approved' })}>Approve</button>}
                  {review.status !== 'rejected' && <button type="button" className={subtleButtonClass} disabled={moderate.isPending} onClick={() => moderate.mutate({ id: review._id, status: 'rejected' })}>Reject</button>}
                </td>
              </tr>
            ))}
          </Table>
        </TableFrame>
      )}
    </>
  );
}

const settingFields = [
  ['minRentalDays', 'Minimum rental days', 1],
  ['maxRentalDays', 'Maximum rental days', 1],
  ['minLeadDays', 'Minimum lead days', 0],
  ['maxAdvanceDays', 'Maximum advance days', 1],
  ['deliveryBufferDays', 'Delivery buffer days', 0],
  ['returnBufferDays', 'Return buffer days', 0],
  ['holdMinutes', 'Payment hold minutes', 1],
  ['gstPercent', 'GST percent', 0],
  ['deliveryFee', 'Delivery fee (paise)', 0],
  ['freeDeliveryAbove', 'Free delivery threshold (paise)', 0],
  ['lateFeeMultiplier', 'Late fee multiplier', 0],
  ['freeCancelHours', 'Free cancellation hours', 0],
];

function SettingsPanel({ currentUserRole }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'settings'], queryFn: api.admin.settings });
  const update = useAdminMutation(api.admin.updateSettings, [['admin', 'settings']]);
  const [values, setValues] = useState({});
  const [pincode, setPincode] = useState({ pincode: '', city: '', state: '', deliveryDays: '2' });
  const pincodeMutation = useAdminMutation(({ code, data }) => api.admin.updatePincode(code, data), [['admin', 'pincodes']]);
  const canEditSettings = currentUserRole === 'superadmin';
  if (query.isPending || query.isError) return <QueryState query={query} />;
  const settings = query.data.data;
  const submit = (event) => {
    event.preventDefault();
    const changed = {};
    for (const [key] of settingFields) {
      if (values[key] !== undefined && String(values[key]) !== String(settings[key])) {
        changed[key] = Number(values[key]);
      }
    }
    if (!Object.keys(changed).length) {
      toast('No settings have changed.');
      return;
    }
    update.mutate(changed, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }) });
  };
  const submitPincode = (event) => {
    event.preventDefault();
    pincodeMutation.mutate({
      code: pincode.pincode,
      data: { city: pincode.city, state: pincode.state, deliveryDays: Number(pincode.deliveryDays), isActive: true },
    }, { onSuccess: () => setPincode({ pincode: '', city: '', state: '', deliveryDays: '2' }) });
  };
  return (
    <>
      <PageTitle title="Settings" description="Update rental, delivery, and tax policies." />
      <form className={`${surface} p-5 sm:p-7`} onSubmit={submit}>
        <fieldset disabled={!canEditSettings}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {settingFields.map(([key, label, min]) => (
              <label key={key} className="text-sm font-medium text-slate-600">{label}
                <input className={`${inputClass} mt-1.5`} type="number" min={min} step={key === 'lateFeeMultiplier' ? '0.1' : '1'} value={values[key] ?? settings[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />
              </label>
            ))}
          </div>
          <button type="submit" className={`${buttonClass} mt-5`} disabled={!canEditSettings || update.isPending}><Check size={16} />Save settings</button>
        </fieldset>
        {!canEditSettings && <p className="mt-4 text-sm text-slate-500">Only a superadministrator can change rental and platform settings.</p>}
      </form>
      <form className={`${surface} mt-5 grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5`} onSubmit={submitPincode}>
        <h2 className="font-semibold text-slate-900 sm:col-span-2 xl:col-span-5">Add or update a serviceable pincode</h2>
        <input className={inputClass} required pattern="[1-9][0-9]{5}" maxLength={6} placeholder="Pincode" value={pincode.pincode} onChange={(event) => setPincode({ ...pincode, pincode: event.target.value })} />
        <input className={inputClass} required maxLength={100} placeholder="City" value={pincode.city} onChange={(event) => setPincode({ ...pincode, city: event.target.value })} />
        <input className={inputClass} required maxLength={100} placeholder="State" value={pincode.state} onChange={(event) => setPincode({ ...pincode, state: event.target.value })} />
        <input className={inputClass} required type="number" min="0" max="30" placeholder="Delivery days" value={pincode.deliveryDays} onChange={(event) => setPincode({ ...pincode, deliveryDays: event.target.value })} />
        <button type="submit" className={buttonClass} disabled={pincodeMutation.isPending}><Check size={16} />Save pincode</button>
      </form>
    </>
  );
}

function AuditPanel() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actorId, setActorId] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const validActorId = !actorId || /^[a-f\d]{24}$/i.test(actorId);
  const validDateRange = !dateRange.from || !dateRange.to || dateRange.from <= dateRange.to;
  const query = useQuery({
    queryKey: ['admin', 'audit', page, action, entityType, actorId, dateRange.from, dateRange.to],
    queryFn: () => api.admin.auditLogs({
      page,
      limit: 20,
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(actorId ? { actorId } : {}),
      ...(dateRange.from ? { from: dateRange.from } : {}),
      ...(dateRange.to ? { to: dateRange.to } : {}),
    }),
    enabled: validActorId && validDateRange,
  });
  return (
    <>
      <PageTitle title="Audit trail" description="Search staff and administrator changes with request correlation." />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBox value={action} onChange={(value) => { setAction(value); setPage(1); }} placeholder="Filter by action…" />
        <label className="relative block w-full sm:max-w-xs">
          <input className={inputClass} value={entityType} maxLength={80} onChange={(event) => { setEntityType(event.target.value); setPage(1); }} placeholder="Filter by entity type…" aria-label="Filter audit by entity type" />
        </label>
        <label className="relative block w-full sm:max-w-xs">
          <input className={inputClass} value={actorId} maxLength={24} onChange={(event) => { setActorId(event.target.value.trim()); setPage(1); }} placeholder="Actor ID (24 characters)" aria-label="Filter audit by actor ID" />
        </label>
        <label className="text-xs font-medium text-slate-600">From
          <input className={`${inputClass} mt-1 block sm:w-40`} type="date" aria-label="Audit start date" max={dateRange.to || undefined} value={dateRange.from} onChange={(event) => { setDateRange({ ...dateRange, from: event.target.value }); setPage(1); }} />
        </label>
        <label className="text-xs font-medium text-slate-600">To
          <input className={`${inputClass} mt-1 block sm:w-40`} type="date" aria-label="Audit end date" min={dateRange.from || undefined} value={dateRange.to} onChange={(event) => { setDateRange({ ...dateRange, to: event.target.value }); setPage(1); }} />
        </label>
      </div>
      {!validActorId && <p className="mb-2 text-sm text-rose-700" role="alert">Actor ID must be a 24-character hexadecimal user ID.</p>}
      {!validDateRange && <p className="mb-4 text-sm text-rose-700" role="alert">The start date must not follow the end date.</p>}
      {!validActorId || !validDateRange ? null : query.isPending || query.isError || !query.data?.data?.length ? <QueryState query={query} empty="No audit events match the filter." /> : (
        <TableFrame result={query.data} page={page} setPage={setPage}>
          <Table headings={['Action', 'Actor', 'Entity', 'Summary', 'Request ID', 'Date']}>
            {query.data.data.map((entry) => (
              <tr key={entry._id}>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{entry.action}</td>
                <td className="px-4 py-3">{entry.actor?.name || entry.actor?.email || '—'}<p className="text-xs text-slate-500">{entry.actorRole}</p></td>
                <td className="whitespace-nowrap px-4 py-3">{entry.entityType} · {entry.entityId}</td>
                <td className="max-w-xs truncate px-4 py-3">{JSON.stringify(entry.summary)}</td>
                <td className="max-w-40 truncate px-4 py-3 font-mono text-xs" title={entry.requestId}>{entry.requestId || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(entry.createdAt)}</td>
              </tr>
            ))}
          </Table>
        </TableFrame>
      )}
    </>
  );
}

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const adminPath = location.pathname.split('/')[2] || '';
  const activeSection = sectionByPath[adminPath] || 'overview';

  useEffect(() => {
    if (!adminPath || !sectionByPath[adminPath]) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [adminPath, navigate]);

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const activeItem = navigation.find((item) => item.path === adminPath) || navigation[0];
  return (
    <div className="-mb-16 min-h-screen bg-slate-50 text-gray-800 md:mb-0">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="rounded-xl bg-purple-600 p-2 text-white"><Activity size={20} /></span>
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900">WardroWave <span className="font-medium text-purple-700">Admin</span></p>
              <p className="truncate text-xs text-slate-500">{user?.name || user?.email || 'Administrator'}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className={subtleButtonClass} onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <button type="button" className={subtleButtonClass} onClick={signOut}><LogOut size={16} /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-3 py-5 sm:px-6 lg:flex-row lg:gap-7 lg:py-7">
        <aside className={`${surface} shrink-0 p-2 lg:sticky lg:top-24 lg:h-fit lg:w-60`}>
          <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto lg:flex-col">
            {navigation.map(({ path, label, icon: Icon }) => (
              <button
                type="button"
                key={path}
                onClick={() => navigate(`/admin/${path}`)}
                aria-current={adminPath === path ? 'page' : undefined}
                className={`admin-nav-button flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:w-full ${
                  adminPath === path
                    ? 'bg-purple-50 text-purple-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={17} />{label}
              </button>
            ))}
          </nav>
          <div className="mt-3 hidden border-t border-slate-100 px-3 pt-3 text-xs text-slate-500 lg:block">
            <div className="flex items-center gap-2"><CircleUserRound size={15} />Server-verified admin access</div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          {activeSection === 'overview' && <OverviewPanel />}
          {activeSection === 'bookings' && <BookingsPanel title={adminPath === 'rentals' ? 'Rentals' : 'Orders'} />}
          {activeSection === 'customers' && <CustomersPanel currentUserId={user?._id} currentUserRole={user?.role} />}
          {activeSection === 'catalog' && <CatalogPanel />}
          {activeSection === 'payments' && <PaymentsPanel />}
          {activeSection === 'inventory' && <InventoryPanel />}
          {activeSection === 'coupons' && <CouponsPanel />}
          {activeSection === 'reviews' && <ReviewsPanel />}
          {activeSection === 'settings' && <SettingsPanel currentUserRole={user?.role} />}
          {activeSection === 'audit' && <AuditPanel />}
          <p className="mt-6 flex items-center gap-2 text-xs text-slate-400"><Archive size={13} />{activeItem.label} · Changes are validated and authorized by the backend.</p>
        </main>
      </div>
    </div>
  );
}
