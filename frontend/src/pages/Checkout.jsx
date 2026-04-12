import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context api/CartContext';
import { useAuth } from '../context api/AuthContext';
import api from '../utils/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import {
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Smartphone,
  Wallet,
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
  const { cart, getCartTotal, clearCart } = useCart();

  // Form states
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Address and UI states
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isShowingForm, setIsShowingForm] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  // Address form
  const [address, setAddress] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('credit-card');

  // Card details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  // UPI details
  const [upiId, setUpiId] = useState('');

  // Order data
  const total = getCartTotal();
  const tax = total * 0.18;
  const deliveryFee = cart.length > 0 ? 99 : 0;
  const grandTotal = total + tax + deliveryFee;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }
    
    // Load saved addresses directly from user context to avoid race conditions
    const loadAddresses = () => {
      // 1. Try Context Profile Addresses
      let loadedAddresses = user?.addresses || [];

      // 2. Fallback to Local Storage if API has zero addresses
      if (!loadedAddresses || loadedAddresses.length === 0) {
        const userIdKey = user?.uid ? `savedAddresses_${user.uid}` : 'savedAddresses';
        const stored = localStorage.getItem(userIdKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedAddresses = parsed;
            }
          } catch (e) {
            console.error('Error parsing saved addresses', e);
          }
        }
      }

      // 3. Apply Addresses
      if (loadedAddresses && loadedAddresses.length > 0) {
        setSavedAddresses(loadedAddresses);
        setAddress(loadedAddresses[0]);
        setIsShowingForm(false);
        setSelectedAddressIndex(0);
      } else {
        setIsShowingForm(true);
        setAddress(prev => ({
          ...prev,
          fullName: user?.fullName || '',
          email: user?.email || '',
          phone: user?.phone || ''
        }));
      }
    };

    loadAddresses();
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {

    }, 100);

    return () => clearTimeout(timer);
  }, [user, cart, navigate]);

  // Validate address
  const validateAddress = () => {
    if (!address.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!address.phone.match(/^\d{10}$/)) {
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

  // Validate payment details
  const validatePayment = () => {
    if (paymentMethod === 'credit-card') {
      if (!cardDetails.cardNumber.match(/^\d{16}$/)) {
        setError('Please enter a valid 16-digit card number');
        return false;
      }
      if (!cardDetails.cardHolder.trim()) {
        setError('Cardholder name is required');
        return false;
      }
      if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
        setError('Please enter expiry date');
        return false;
      }
      if (!cardDetails.cvv.match(/^\d{3,4}$/)) {
        setError('Please enter a valid CVV');
        return false;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/)) {
        setError('Please enter a valid UPI ID (e.g., name@upi)');
        return false;
      }
    }
    return true;
  };

  // Process payment
  const processPayment = async () => {
    setError('');
    if (!validatePayment()) return;

    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order
      const order = {
        orderId: `ORD-${Date.now()}`,
        user: {
          name: address.fullName,
          email: address.email,
          phone: address.phone
        },
        shippingAddress: address,
        items: cart,
        totalAmount: grandTotal, // for OrderHistory compat
        pricing: {
          subtotal: total,
          tax: tax,
          deliveryFee: deliveryFee,
          total: grandTotal
        },
        paymentMethod: paymentMethod,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      // Save order to backend
      try {
        await api.order.create({
          ...order,
          items: cart.map(item => ({
            productId: item.id || item.productId,
            name: item.name,
            quantity: item.quantity,
            rentalDays: item.rentalDays,
            rentalPrice: item.rentalPrice,
            image: item.image || (item.images && item.images[0])
          }))
        });
      } catch (err) {
        console.error("Failed to sync order to profile", err);
      }

      // Also save to localStorage as fallback/cache
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      existingOrders.push(order);
      localStorage.setItem('orders', JSON.stringify(existingOrders));

      setSuccess('Payment successful! Order confirmed.');
      clearCart();

      // Redirect to success page
      setTimeout(() => {
        navigate('/order-success', { state: { order } });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
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

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    }

    // Limit CVV to 4 digits
    if (name === 'cvv' && value.length > 4) return;

    setCardDetails(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    setError('');
  };

  const handleProceedToPayment = () => {
    if (validateAddress()) {
      setError('');
      setCurrentStep(2);
    }
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
                            setAddress(addr);
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
                                  setCurrentStep(2);
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
                            fullName: user?.fullName || '',
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
                              
                              // Sync to backend profile
                              try {
                                const newAddressData = {
                                  label: 'Home',
                                  fullName: address.fullName,
                                  phone: address.phone,
                                  addressLine1: address.addressLine1,
                                  city: address.city,
                                  state: address.state,
                                  pincode: address.pincode,
                                  isDefault: false
                                };
                                await api.user.addAddress(newAddressData);
                              } catch (err) {
                                console.error('Failed to sync address to profile', err);
                              }

                              const userIdKey = user?.uid ? `savedAddresses_${user.uid}` : 'savedAddresses';
                              let stored = [...savedAddresses];
                              
                              // Replace if editing, push if new
                              // We use city and state + line1 as a rough unique identifier
                              const existsIdx = stored.findIndex(a => a.addressLine1 === address.addressLine1 && a.pincode === address.pincode);
                              if (existsIdx === -1) {
                                  stored.push(address);
                                  setSelectedAddressIndex(stored.length - 1);
                              } else {
                                  stored[existsIdx] = address;
                                  setSelectedAddressIndex(existsIdx);
                              }
                              
                              localStorage.setItem(userIdKey, JSON.stringify(stored));
                              setSavedAddresses(stored);
                              setIsShowingForm(false);
                            }
                          }}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
                        >
                          Save Address
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
                    <p className="text-gray-600 text-sm">Choose your preferred payment method</p>
                  </div>

                  {/* Payment Method Options */}
                  <div className="space-y-4">
                    {/* Credit Card Option */}
                    <div
                      onClick={() => setPaymentMethod('credit-card')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        paymentMethod === 'credit-card'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'credit-card' ? 'border-purple-600 bg-purple-600' : 'border-gray-400'
                        }`}>
                          {paymentMethod === 'credit-card' && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Credit/Debit Card</p>
                            <p className="text-sm text-gray-600">Visa, Mastercard, RuPay</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* UPI Option */}
                    <div
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        paymentMethod === 'upi'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'upi' ? 'border-purple-600 bg-purple-600' : 'border-gray-400'
                        }`}>
                          {paymentMethod === 'upi' && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-semibold text-gray-900">UPI</p>
                            <p className="text-sm text-gray-600">Google Pay, PhonePe, Paytm</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wallet Option */}
                    <div
                      onClick={() => setPaymentMethod('wallet')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        paymentMethod === 'wallet'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === 'wallet' ? 'border-purple-600 bg-purple-600' : 'border-gray-400'
                        }`}>
                          {paymentMethod === 'wallet' && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Digital Wallet</p>
                            <p className="text-sm text-gray-600">Amazon Pay, Mobikwik</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Form */}
                  {paymentMethod === 'credit-card' && (
                    <div className="space-y-4 pt-6 border-t">
                      <h3 className="font-bold text-gray-900">Card Details</h3>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cardholder Name</label>
                        <input
                          type="text"
                          name="cardHolder"
                          value={cardDetails.cardHolder}
                          onChange={handleCardChange}
                          placeholder="Name on card"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={cardDetails.cardNumber}
                          onChange={handleCardChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                          <select
                            name="expiryMonth"
                            value={cardDetails.expiryMonth}
                            onChange={handleCardChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                          >
                            <option value="">MM</option>
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                {String(i + 1).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                          <select
                            name="expiryYear"
                            value={cardDetails.expiryYear}
                            onChange={handleCardChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                          >
                            <option value="">YY</option>
                            {Array.from({ length: 10 }, (_, i) => {
                              const year = new Date().getFullYear() + i;
                              return (
                                <option key={year} value={String(year).slice(-2)}>
                                  {String(year).slice(-2)}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
                          <input
                            type="text"
                            name="cvv"
                            value={cardDetails.cvv}
                            onChange={handleCardChange}
                            placeholder="123"
                            maxLength="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div className="space-y-4 pt-6 border-t">
                      <h3 className="font-bold text-gray-900">UPI Payment</h3>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">UPI ID</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value);
                            setError('');
                          }}
                          placeholder="yourname@upi (e.g., john@okhdfcbank)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                        />
                        <p className="text-xs text-gray-600 mt-2">Supports Google Pay, PhonePe, Paytm, WhatsApp Pay</p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div className="space-y-4 pt-6 border-t text-center">
                      <p className="text-gray-600">You will be redirected to the wallet provider</p>
                    </div>
                  )}

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
                          Complete Payment
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
                    <p className="font-semibold text-gray-900 ml-2">₹{Math.round(item.rentalPrice * item.quantity * (item.rentalDays / (item.duration || 3)))}</p>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{Math.round(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="font-medium">₹{Math.round(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">₹{deliveryFee}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-purple-600">₹{Math.round(grandTotal)}</span>
                </div>
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
