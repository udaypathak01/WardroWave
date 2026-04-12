import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user orders. Currently using mock data if API fails to show UI structure.
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.order.getAll();
        // Fallback to empty array if no orders exist instead of mock array
        setOrders(res.data?.orders || []);
      } catch (err) {
        toast.error('Failed to load order history');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No active rentals</h3>
        <p className="text-gray-500">You haven't rented any clothes yet. Explore our AI try-on to find your perfect fit!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-50 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-bold text-gray-900">{order.id}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusBadge(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-xl font-black text-gray-900 border-b-2 border-transparent w-fit md:ml-auto focus:border-purple-600 transition-colors">
                ₹{order.totalAmount || order.pricing?.total || 0}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex overflow-hidden">
                 {order.items && order.items[0]?.image ? (
                   <img src={order.items[0].image} className="w-full h-full object-cover" alt="item" />
                 ) : (
                   <Package className="w-6 h-6 text-purple-600 m-auto" />
                 )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{order.items && order.items[0]?.name ? order.items[0].name : "Outfit Combination"}</h4>
                <p className="text-sm text-gray-500">{order.items ? order.items.length : 1} Items</p>
              </div>
            </div>
            <button className="px-5 py-2 text-sm font-bold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200">
              View Invoice
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
