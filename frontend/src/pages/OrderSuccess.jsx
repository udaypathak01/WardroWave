import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Phone, Mail, Download, Home } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context api/AuthContext';

export default function OrderSuccess() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (order) return;
    const bookingId = searchParams.get('bookingId');
    if (!bookingId) {
      setLoading(false);
      setLoadError('No booking was selected.');
      return;
    }
    let active = true;
    api.order.getById(bookingId)
      .then(({ data: booking }) => {
        if (!active) return;
        setOrder({
          orderId: booking.bookingNumber,
          bookingId: booking._id,
          user: { name: booking.shippingAddress.fullName, email: user?.email || '', phone: booking.shippingAddress.phone },
          shippingAddress: { ...booking.shippingAddress, addressLine1: booking.shippingAddress.line1, addressLine2: booking.shippingAddress.line2 },
          items: booking.items.map((item) => ({ name: item.titleSnapshot, image: item.imageSnapshot, quantity: 1, rentalDays: item.rentalDays, rentalPrice: item.rentalCharge / 100, duration: item.rentalDays })),
          pricing: {
            subtotal: booking.pricing.rentalSubtotal / 100,
            discount: booking.pricing.discount / 100,
            couponCode: booking.pricing.couponCode,
            tax: booking.pricing.gstAmount / 100,
            gstPercent: booking.pricing.gstPercent,
            deliveryFee: booking.pricing.deliveryFee / 100,
            deposit: booking.pricing.depositTotal / 100,
            total: booking.pricing.grandTotal / 100,
          },
          paymentMethod: 'Razorpay',
          paymentStatus: booking.payment?.status,
          status: booking.status,
          createdAt: booking.createdAt,
        });
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Could not load this booking.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [order, searchParams, retryCount, user?.email]);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          {loading ? (
            <p role="status" className="text-gray-600">Loading booking…</p>
          ) : (
            <div role="alert" className="mx-auto max-w-lg rounded-2xl bg-white p-8">
              <p className="mb-5 text-gray-700">{loadError || 'Booking details are unavailable.'}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setLoadError('');
                  setRetryCount((count) => count + 1);
                }}
                className="mr-4 font-semibold text-purple-600 underline"
              >
                Retry
              </button>
              <button onClick={() => navigate('/profile')} className="font-semibold text-purple-600 underline">
                View bookings
              </button>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const downloadInvoice = async () => {
    try {
      const blob = await api.order.getInvoice(order.bookingId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderId}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(error.message || 'Could not download invoice');
    }
  };
  const paymentConfirmed = order.paymentStatus === 'captured'
    || ['confirmed', 'partially_dispatched', 'dispatched', 'delivered', 'return_requested', 'returned', 'completed']
      .includes(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Success Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {paymentConfirmed ? 'Order Confirmed!' : 'Payment Not Confirmed'}
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            {paymentConfirmed
              ? 'Thank you for your order. Your items will be prepared for delivery.'
              : 'Your booking is not confirmed yet. Check your booking history before trying payment again.'}
          </p>
          <p className="text-gray-600">
            Order ID: <span className="font-bold text-purple-600">{order.orderId}</span>
          </p>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Package className="w-6 h-6 text-purple-600" />
                Order Details
              </h2>

              {/* Timeline */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                    <div className="w-1 h-16 bg-green-200"></div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {paymentConfirmed ? 'Payment Confirmed' : 'Payment Pending'}
                    </p>
                    <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-blue-300 rounded-full"></div>
                    <div className="w-1 h-16 bg-gray-200"></div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Processing</p>
                    <p className="text-sm text-gray-600">
                      {paymentConfirmed ? 'Your order is being prepared' : 'We are waiting for payment confirmation'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Shipped</p>
                    <p className="text-sm text-gray-600">You'll receive tracking info soon</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Ordered Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} × {item.rentalDays} days
                        </p>
                      </div>
                      <p className="font-bold text-purple-600">
                        ₹{Math.round(item.rentalPrice * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-purple-600" />
                Shipping Address
              </h2>

              <div className="space-y-3 text-gray-700">
                <p className="font-semibold text-lg">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                </p>
                <div className="pt-4 border-t flex flex-wrap gap-6">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Phone className="w-5 h-5" />
                    {order.shippingAddress.phone}
                  </div>
                  {order.user.email && (
                    <div className="flex items-center gap-2 text-purple-600">
                      <Mail className="w-5 h-5" />
                      {order.user.email}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{Math.round(order.pricing.subtotal)}</span>
                </div>
                {order.pricing.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount{order.pricing.couponCode ? ` (${order.pricing.couponCode})` : ''}</span>
                    <span className="font-medium">-₹{Math.round(order.pricing.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>GST ({order.pricing.gstPercent ?? 0}%)</span>
                  <span className="font-medium">₹{Math.round(order.pricing.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">₹{order.pricing.deliveryFee}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Refundable security deposit</span>
                  <span className="font-medium">₹{Math.round(order.pricing.deposit || 0)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span className="text-purple-600">₹{Math.round(order.pricing.total)}</span>
              </div>

              {/* Payment Info */}
              <div className="p-4 bg-blue-50 rounded-lg mb-6">
                <p className="text-sm font-semibold text-blue-900 mb-1">Payment Method</p>
                <p className="text-sm text-blue-800 capitalize">
                  {order.paymentMethod}
                </p>
              </div>

              {/* Status */}
              <div className={`p-4 rounded-lg ${paymentConfirmed ? 'bg-green-50' : 'bg-amber-50'}`}>
                <p className={`text-sm font-semibold mb-1 ${paymentConfirmed ? 'text-green-900' : 'text-amber-900'}`}>
                  Status
                </p>
                <p className={`text-sm capitalize font-bold ${paymentConfirmed ? 'text-green-800' : 'text-amber-800'}`}>
                  {order.status}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={downloadInvoice}
                disabled={!paymentConfirmed}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Download Invoice
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition font-semibold flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
          <h3 className="font-bold text-gray-900 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>✓ You'll receive an email confirmation shortly</li>
            <li>✓ Your items will be carefully packaged and shipped within 24 hours</li>
            <li>✓ You'll get a tracking link to monitor your shipment</li>
            <li>✓ Free return shipping is included with every rental</li>
            <li>✓ Damage protection covers accidental wear and tear</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
}
