import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, Home, Briefcase, Star, Loader2 } from 'lucide-react';
import { useAuth } from '../../context api/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AddressManagement() {
  const { user, updateProfile } = useAuth();
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.user.getAddresses();
      const fetched = res.data?.addresses || [];
      setAddresses(fetched);
      if (updateProfile) updateProfile({ addresses: fetched }); // sync context
    } catch (err) {
      // Intentionally ignore failure if we already have context fallback.
      if (addresses.length === 0) toast.error('Failed to load saved addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // We already have user.addresses initially, but we fetch to ensure sync in background
    fetchAddresses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
      return toast.error('Please fill all required fields');
    }
    
    try {
      setIsSubmitting(true);
      await api.user.addAddress(formData);
      toast.success('Address saved successfully');
      setShowForm(false);
      setFormData({ label: 'Home', fullName: '', phone: '', addressLine1: '', city: '', state: '', pincode: '', isDefault: false });
      fetchAddresses();
    } catch (err) {
      toast.error(err.message || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.user.deleteAddress(id);
      toast.success('Address removed');
      fetchAddresses();
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const getAddressIcon = (type) => {
    switch(type) {
      case 'Home': return <Home className="w-5 h-5" />;
      case 'Work': return <Briefcase className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg transition-all font-bold flex items-center gap-2 shadow-md shadow-purple-200"
        >
          <Plus className="w-5 h-5" />
          Add New Address
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-purple-200 shadow-sm animate-fade-in mb-8">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Add New Delivery Address</h3>
          <form className="space-y-4" onSubmit={handleSaveAddress}>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Type</label>
              <select name="label" value={formData.label} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none bg-white">
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="Enter Full Name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="10-digit mobile number" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line</label>
              <textarea name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" rows="2" placeholder="Flat, House no., Building, Company..."></textarea>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="Mumbai" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="Maharashtra" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">PIN Code</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none" placeholder="123456" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 pb-4">
              <input type="checkbox" id="isDefault" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded border-gray-300" />
              <label htmlFor="isDefault" className="text-sm text-gray-700 font-medium">Set as default delivery address</label>
            </div>

            <div className="flex gap-4 pt-2">
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition shadow-lg shadow-purple-200 disabled:opacity-50 flex justify-center items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Address'}
              </button>
              <button type="button" disabled={isSubmitting} onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition disabled:opacity-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.length === 0 && !showForm && (
          <div className="col-span-2 text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">No Saved Addresses</h3>
            <p className="text-gray-500">Add a delivery address to make checkout faster.</p>
          </div>
        )}
        
        {addresses.map((address) => (
          <div key={address.id} className={`p-6 rounded-2xl border-2 transition-all group ${address.isDefault ? 'border-purple-600 bg-purple-50 shadow-sm' : 'border-gray-200 bg-white hover:border-purple-300'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full ${address.isDefault ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
                  {getAddressIcon(address.label)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 border-b-2 border-transparent hover:border-purple-500 w-fit cursor-pointer transition-colors pt-1 flex items-center gap-2">
                    {address.fullName} 
                    {address.isDefault && <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full select-none cursor-default"><Star className="w-2.5 h-2.5 inline-block mr-0.5"/> Default</span>}
                  </h4>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{address.label}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleDelete(address.id)}
                  className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition shadow-sm" 
                  title="Delete Address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed mb-4 min-h-[40px]">
              <span className="font-medium text-gray-900">{address.phone}</span><br />
              {address.addressLine1}<br />
              {address.city}, {address.state} — {address.pincode}
            </p>

            {!address.isDefault && (
              <button disabled className="w-full opacity-0 group-hover:opacity-100 transition-opacity py-2 bg-gray-900 text-white rounded-lg text-sm font-bold shadow-md">
                Set as Default (Coming Soon)
              </button>
            )}
            
          </div>
        ))}
      </div>
    </div>
  );
}
