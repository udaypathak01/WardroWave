import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Calendar } from 'lucide-react';
import { useEffect } from 'react';
import { useCart } from '../context api/CartContext';

import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useNavigate } from 'react-router-dom';

function CartItem({ item }) {
  const { updateQuantity, updateRentalDays, removeFromCart } = useCart();
  const itemTotal = item.rentalPrice * item.quantity * (item.rentalDays / (item.duration || 3));

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 flex flex-col md:flex-row gap-3 sm:gap-4">
      {/* Image */}
      <div className="w-full sm:w-24 md:w-32 h-24 sm:h-24 md:h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
            <p className="text-sm text-gray-600 capitalize">Category: {item.category}</p>
          </div>
          <button
            onClick={() => removeFromCart(item.id)}
            className="p-2 sm:p-3 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Remove from cart"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4">
          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Quantity:</span>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 sm:p-2 hover:bg-gray-100 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-bold">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 sm:p-2 hover:bg-gray-100 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rental Days */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-600" />
            <select
              value={item.rentalDays}
              onChange={(e) => updateRentalDays(item.id, parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
            >
              <option value={3}>3 Days</option>
              <option value={5}>5 Days</option>
              <option value={7}>7 Days</option>
              <option value={10}>10 Days</option>
              <option value={15}>15 Days</option>
            </select>
          </div>

          {/* Price */}
          <div className="ml-auto">
            <p className="text-sm text-gray-600">Rental Price</p>
            <p className="text-xl font-bold text-purple-600">₹{Math.round(itemTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { cart, clearCart, getCartTotal } = useCart();
  const navigate = useNavigate();
  const total = getCartTotal();
  const tax = total * 0.18; // 18% GST
  const deliveryFee = cart.length > 0 ? 99 : 0;
  const grandTotal = total + tax + deliveryFee;

  useEffect(() => {

  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Shopping Cart</h1>
          </div>
          <p className="text-gray-100 text-xs sm:text-sm md:text-base">
            {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Cart Items</h2>
                <button
                  onClick={clearCart}
                  className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition font-medium text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </button>
              </div>

              {cart.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 md:top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                
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
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-purple-600">₹{Math.round(grandTotal)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-bold flex items-center justify-center gap-2 mb-4">
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => navigate('/rentals')}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Continue Shopping
                </button>

                {/* Security Info */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-2">🔒 Secure Checkout</p>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>✓ Quality checked items</li>
                    <li>✓ Free pickup & return</li>
                    <li>✓ Damage protection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Cart */
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add items to your cart to get started with renting premium fashion
            </p>
            <button
              onClick={() => navigate('/rentals')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-semibold inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Rentals
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
