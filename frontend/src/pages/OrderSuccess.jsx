import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Phone, Mail, Download, Home } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useEffect } from 'react';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    if (!order) {
      navigate('/cart');
    }
  }, [order, navigate]);

  if (!order) {
    return null;
  }

  const downloadInvoice = () => {
    const invoiceContent = `
WARDOWAVE - ORDER INVOICE
Order ID: ${order.orderId}
Date: ${new Date(order.createdAt).toLocaleDateString()}

CUSTOMER DETAILS:
Name: ${order.user.name}
Email: ${order.user.email}
Phone: ${order.user.phone}

SHIPPING ADDRESS:
${order.shippingAddress.addressLine1}
${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '\n' : ''}
${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}

ORDER ITEMS:
${order.items.map(item => `${item.name} - Qty: ${item.quantity} × ${item.rentalDays} days - ₹${Math.round(item.rentalPrice * item.quantity * (item.rentalDays / (item.duration || 3)))}`).join('\n')}

PRICING:
Subtotal: ₹${Math.round(order.pricing.subtotal)}
GST (18%): ₹${Math.round(order.pricing.tax)}
Delivery Fee: ₹${order.pricing.deliveryFee}
Total: ₹${Math.round(order.pricing.total)}

Payment Method: ${order.paymentMethod}
Status: ${order.status}
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(invoiceContent));
    element.setAttribute('download', `invoice-${order.orderId}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Thank you for your order. Your items will be shipped soon.
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
                    <p className="font-bold text-gray-900">Order Confirmed</p>
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
                    <p className="text-sm text-gray-600">Your order is being prepared</p>
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
                        ₹{Math.round(item.rentalPrice * item.quantity * (item.rentalDays / (item.duration || 3)))}
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
                <div className="pt-4 border-t flex gap-6">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Phone className="w-5 h-5" />
                    {order.shippingAddress.phone}
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <Mail className="w-5 h-5" />
                    {order.user.email}
                  </div>
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
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="font-medium">₹{Math.round(order.pricing.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">₹{order.pricing.deliveryFee}</span>
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
                  {order.paymentMethod === 'credit-card' ? 'Credit/Debit Card' : 
                   order.paymentMethod === 'upi' ? 'UPI' : 'Digital Wallet'}
                </p>
              </div>

              {/* Status */}
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-1">Status</p>
                <p className="text-sm text-green-800 capitalize font-bold">
                  {order.status}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={downloadInvoice}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center justify-center gap-2"
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
