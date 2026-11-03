import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context api/CartContext';
import { useAuth } from '../context api/AuthContext';
import api from '../utils/api';
import { rentalCalendarDate } from '../utils/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import {
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Loader,
  Lock,
  ArrowLeft
} from 'lucide-react';


export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, couponCode, isLoading: cartLoading, getCartTotal, clearCart } = useCart();

  // Form states
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Address and UI states
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [isShowingForm, setIsShowingForm] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  // Address form
  const [address, setAddress] = useState({
    fullName: user?.name || user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  const idempotencyKey = useRef(crypto.randomUUID());

  // Order data
  const total = quote ? quote.rentalSubtotal / 100 : getCartTotal();
  const discount = quote ? quote.discount / 100 : 0;
  const tax = quote ? quote.gstAmount / 100 : 0;
  const deliveryFee = quote ? quote.deliveryFee / 100 : 0;
  const deposit = quote ? quote.depositTotal / 100 : 0;
  const grandTotal = quote ? quote.grandTotal / 100 : total;

  useEffect(() => {
    if (!/^\d{6}$/.test(address.pincode) || cart.length === 0) {
      setQuote(null);
      setQuoteLoading(false);
      return undefined;
    }
    let active = true;
    setError('');
    setQuoteLoading(true);
    const items = cart.map((item) => ({
      variantId: item.variantId,
      startDate: rentalCalendarDate(item.startDate),
      endDate: rentalCalendarDate(item.endDate),
    }));
    api.order.getQuote({
      items,
      pincode: address.pincode,
      ...(couponCode ? { couponCode } : {}),
    })
      .then((response) => { if (active) setQuote(response.data); })
      .catch((error) => { if (active) { setQuote(null); setError(error.message); } })
      .finally(() => { if (active) setQuoteLoading(false); });
    return () => { active = false; };
  }, [address.pincode, cart, couponCode]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!cartLoading && cart.length === 0) {
      navigate('/cart');
    }
  }, [user, navigate, cart.length, cartLoading]);

  useEffect(() => {
    if (!user) return;
    const loadedAddresses = (user?.addresses || []).map((entry) => ({
      ...entry,
      addressLine1: entry.line1,
      addressLine2: entry.line2 || '',
      email: user.email || '',
    }));
    if (loadedAddresses.length) {
      setSavedAddresses(loadedAddresses);
      const selectedIndex = Math.max(0, loadedAddresses.findIndex((entry) => entry.isDefault));
      const selected = loadedAddresses[selectedIndex];
      setSelectedAddressIndex(selectedIndex);
      setAddress({ ...selected, addressLine1: selected.line1, addressLine2: selected.line2 || '', email: user.email || '' });
      setIsShowingForm(false);
    } else {
      setIsShowingForm(true);
      setAddress((prev) => ({ ...prev, fullName: user?.name || '', email: user?.email || '', phone: user?.phone || '' }));
    }
  }, [user]);

  // Validate address
  const validateAddress = () => {
    if (!address.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!/^\+?\d{10,13}$/.test(String(address.phone || '').replace(/[\s()-]/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!address.addressLine1.trim()) {
      setError('Address line 1 is required');
      return false;
    }
    if (!address.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!address.state.trim()) {
      setError('State is required');
      return false;
    }
    if (!address.pincode.match(/^\d{6}$/)) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  // Process payment
  const processPayment = async () => {
    setError('');
    if (!quote || quoteLoading) {
      setError('Enter a valid delivery pincode and wait for the rental quote before paying.');
      return;
    }
    if (!quote.available) {
      setError('One or more selected items are unavailable for these rental dates.');
      return;
    }

    setLoading(true);
    try {
      let addressId = address._id || address.id;
      if (!addressId) {
        throw new Error('Save your delivery address before payment.');
      }
      const bookingRes = await api.order.create({ addressId }, idempotencyKey.current);
      const paymentOrder = bookingRes.data;
      const booking = paymentOrder?.booking;
      if (!booking?._id || !paymentOrder.razorpayOrderId || !paymentOrder.keyId) {
        throw new Error('The payment provider is not ready. Please try again later.');
      }
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Could not load the secure payment window.'));
          document.body.appendChild(script);
        });
      }
      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'WardroWave',
        description: `Rental booking ${booking.bookingNumber}`,
        order_id: paymentOrder.razorpayOrderId,
        prefill: paymentOrder.prefill,
        theme: { color: '#7c3aed' },
        handler: async (result) => {
          try {
            const verification = await api.order.verifyPayment({
              razorpay_order_id: result.razorpay_order_id,
              razorpay_payment_id: result.razorpay_payment_id,
              razorpay_signature: result.razorpay_signature,
            });
            const bookingResponse = await api.order.getById(verification.data.bookingId || booking._id);
            const confirmed = bookingResponse.data;
            const order = {
              orderId: confirmed.bookingNumber,
              bookingId: confirmed._id,
              user: { name: confirmed.shippingAddress.fullName, email: user.email, phone: confirmed.shippingAddress.phone },
              shippingAddress: { ...confirmed.shippingAddress, addressLine1: confirmed.shippingAddress.line1, addressLine2: confirmed.shippingAddress.line2 },
              items: confirmed.items.map((item) => ({ name: item.titleSnapshot, image: item.imageSnapshot, quantity: 1, rentalDays: item.rentalDays, rentalPrice: item.rentalCharge / 100, duration: item.rentalDays })),
              pricing: {
                subtotal: confirmed.pricing.rentalSubtotal / 100,
                discount: confirmed.pricing.discount / 100,
                couponCode: confirmed.pricing.couponCode,
                tax: confirmed.pricing.gstAmount / 100,
                gstPercent: confirmed.pricing.gstPercent,
                deliveryFee: confirmed.pricing.deliveryFee / 100,
                deposit: confirmed.pricing.depositTotal / 100,
                total: confirmed.pricing.grandTotal / 100,
              },
              paymentMethod: 'Razorpay',
              paymentStatus: confirmed.payment?.status,
              status: confirmed.status,
              createdAt: confirmed.createdAt,
            };
            await clearCart();
            setSuccess('Payment successful! Your rental is confirmed.');
            navigate(`/order-success?bookingId=${encodeURIComponent(order.bookingId)}`, { state: { order } });
          } catch (verifyError) {
            setError(verifyError.message || 'Payment received but confirmation is still processing. Check your booking history before retrying.');
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      checkout.on('payment.failed', (event) => {
        setError(event.error?.description || 'Payment failed. You can try again.');
        setLoading(false);
      });
      checkout.open();
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Progress Bar */}
      <div className="bg-white border-b sticky top-16 md:top-20 z-40">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex-1">
              <div className={`flex items-center gap-1 md:gap-2 pb-2 ${currentStep >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-7 md:w-8 h-7 md:h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>
                  1
                </div>
                <span className="font-semibold hidden md:inline text-sm">Shipping</span>
              </div>
              {currentStep >= 1 && <div className="h-1 bg-purple-600 rounded"></div>}
            </div>

            <ChevronRight className={`w-4 md:w-5 h-4 md:h-5 mx-1 md:mx-2 ${currentStep >= 2 ? 'text-purple-600' : 'text-gray-400'}`} />

            <div className="flex-1">
              <div className={`flex items-center gap-1 md:gap-2 pb-2 ${currentStep >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-7 md:w-8 h-7 md:h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>
                  2
                </div>
                <span className="font-semibold hidden md:inline text-sm">Payment</span>
              </div>
              {currentStep >= 2 && <div className="h-1 bg-purple-600 rounded"></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 checkout-slide-in">
              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 font-medium">{success}</p>
                </div>
              )}

              {currentStep === 1 ? (
                // Shipping Address Section
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <MapPin className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" />
                      Shipping Address
                    </h2>
                    <p className="text-gray-600 text-xs sm:text-sm">Select or enter your delivery address</p>
                  </div>

                  {!isShowingForm && savedAddresses.length > 0 ? (
                    // Saved Addresses List
                    <div className="space-y-4">
                      {savedAddresses.map((addr, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedAddressIndex(idx);
                            setAddress({ ...addr, addressLine1: addr.addressLine1 || addr.line1, addressLine2: addr.addressLine2 || addr.line2 || '' });
                            setError('');
                          }}
                          className={`p-4 sm:p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedAddressIndex === idx
                              ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-base">{addr.fullName}</span>
                                {selectedAddressIndex === idx && (
                                  <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {addr.addressLine1}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                                <br />
                                {addr.city}, {addr.state} {addr.pincode}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5"/> {addr.phone}</span>
                                <span className="flex items-center gap-1 truncate"><Mail className="w-3.5 h-3.5"/> {addr.email}</span>
                              </div>
                            </div>
                            <div className="flex items-start pt-1">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                selectedAddressIndex === idx ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                              }`}>
                                {selectedAddressIndex === idx && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                          </div>

                          {selectedAddressIndex === idx && (
                            <div className="mt-5 pt-4 border-t border-purple-100 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (validateAddress()) setCurrentStep(2);
                                }}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:shadow-md transition-all flex items-center gap-2"
                              >
                                Deliver to this address
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsShowingForm(true);
                                }}
                                className="bg-white border text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                              >
                                Edit Address
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setAddress({
                            fullName: user?.name || user?.fullName || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            addressLine1: '',
                            addressLine2: '',
                            city: '',
                            state: '',
                            pincode: '',
                            country: 'India'
                          });
                          setIsShowingForm(true);
                        }}
                        className="w-full py-4 border-2 border-dashed border-gray-300 text-purple-600 rounded-xl font-semibold hover:border-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 group"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <span className="text-xl leading-none">+</span>
                        </div>
                        Add New Address
                      </button>
                    </div>
                  ) : (
                    // Address Form
                    <form className="space-y-4">
                      {/* Full Name & Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            name="fullName"
                            value={address.fullName}
                            onChange={handleAddressChange}
                            placeholder="Your full name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={address.email}
                            onChange={handleAddressChange}
                            placeholder="Your email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={address.phone}
                          onChange={handleAddressChange}
                          placeholder="10-digit phone number"
                          maxLength="10"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                        />
                      </div>

                      {/* Address Lines */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                        <input
                          type="text"
                          name="addressLine1"
                          value={address.addressLine1}
                          onChange={handleAddressChange}
                          placeholder="Street address"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          name="addressLine2"
                          value={address.addressLine2}
                          onChange={handleAddressChange}
                          placeholder="Apartment, suite, etc."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                        />
                      </div>

                      {/* City, State, Pincode */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            name="city"
                            value={address.city}
                            onChange={handleAddressChange}
                            placeholder="City"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                          <input
                            type="text"
                            name="state"
                            value={address.state}
                            onChange={handleAddressChange}
                            placeholder="State"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                          <input
                            type="text"
                            name="pincode"
                            value={address.pincode}
                            onChange={handleAddressChange}
                            placeholder="6-digit pincode"
                            maxLength="6"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-4 pt-6 border-t">
                        {savedAddresses.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setIsShowingForm(false)}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/cart')}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
                          >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Cart
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (validateAddress()) {
                              setError('');
                              
                              try {
                                const addressData = {
                                  label: 'Home',
                                  fullName: address.fullName,
                                  phone: address.phone,
                                  addressLine1: address.addressLine1,
                                  addressLine2: address.addressLine2,
                                  city: address.city,
                                  state: address.state,
                                  pincode: address.pincode,
                                  isDefault: savedAddresses.length === 0
                                };
                                const response = address._id
                                  ? await api.user.updateAddress(address._id, addressData)
                                  : await api.user.addAddress(addressData);
                                const saved = response.data;
                                const normalized = { ...saved, addressLine1: saved.line1, addressLine2: saved.line2 || '', email: user?.email || '' };
                                const updated = address._id
                                  ? savedAddresses.map((entry) => entry._id === address._id ? normalized : entry)
                                  : [...savedAddresses, normalized];
                                setSavedAddresses(updated);
                                setSelectedAddressIndex(Math.max(0, updated.findIndex((entry) => entry._id === normalized._id)));
                                setAddress(normalized);
                                setIsShowingForm(false);
                                setCurrentStep(2);
                              } catch (err) {
                                setError(err.message || 'Could not save this address. Please try again.');
                              }
                            }
                          }}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
                        >
                          Save & Proceed to Payment
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                // Payment Method Selection
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                      Payment Method
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Choose card, UPI, or a supported wallet in Razorpay Checkout.
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                    <p className="font-semibold text-purple-900">Secure payment with Razorpay</p>
                    <p className="mt-1 text-sm text-purple-800">Choose card, UPI, or a supported wallet in the secure payment window. Card details are never entered on WardroWave.</p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={processPayment}
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Pay securely with Razorpay
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-32 order-summary-slide-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-6 pb-6 border-b max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity} × {item.rentalDays} days</p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-2">
                      ₹{Math.round(
                        (item.rentalPrice + (item.extraDayPrice || 0)
                          * Math.max(0, item.rentalDays - (item.minRentalDays || 3)))
                        * item.quantity,
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{Math.round(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount{quote?.couponCode ? ` (${quote.couponCode})` : ''}</span>
                    <span className="font-medium">-₹{Math.round(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>GST ({quote?.gstPercent ?? 0}%)</span>
                  <span className="font-medium">₹{Math.round(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Refundable security deposit</span>
                  <span className="font-medium">₹{Math.round(deposit)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-purple-600">₹{Math.round(grandTotal)}</span>
                </div>
                {quoteLoading && <p className="text-sm text-gray-500">Checking delivery and rental availability…</p>}
                {quote && !quote.available && <p className="text-sm text-red-600">One or more items are unavailable for these dates or this delivery pincode.</p>}
                {quote?.available && <p className="text-xs text-green-700">Rental dates and delivery area are available.</p>}
              </div>

              {/* Security Info */}
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-2">🔒 Secure & Safe</p>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>✓ SSL Encrypted</li>
                  <li>✓ PCI Compliant</li>
                  <li>✓ Money Back Guarantee</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
