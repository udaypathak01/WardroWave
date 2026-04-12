import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Calendar, Edit2, Save, X, LogOut, ArrowLeft, CheckCircle, AlertCircle, ShoppingBag, MapPin, Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context api/AuthContext";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import GSAPTabTransition from "../components/animations/GSAPTabTransition";
import GSAPReveal from "../components/animations/GSAPReveal";

// Phase 3 Profile Sub-components
import OrderHistory from '../components/profile/OrderHistory';
import AddressManagement from '../components/profile/AddressManagement';
import VirtualCloset from '../components/profile/VirtualCloset';

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Please log in first
            </h2>
            <Link
              to="/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Login
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editData.fullName.trim()) { setError("Full name cannot be empty"); return; }
    if (!editData.phone.trim()) { setError("Phone number cannot be empty"); return; }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateProfile({
        fullName: editData.fullName,
        phone: editData.phone,
      });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">

        <GSAPReveal direction="right" distance={30}>
          <Link
            to="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-8 transition font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </GSAPReveal>

        {/* Header Profile Card */}
        <GSAPReveal direction="up" distance={40} delay={0.1}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 sm:px-8 py-8 flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white rounded-full flex justify-center items-center text-4xl font-black text-purple-600 shadow-xl border-4 border-white/30 backdrop-blur-sm">
                  {user.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white drop-shadow-sm">
                    {user.fullName}
                  </h1>
                  <p className="text-purple-100 font-medium opacity-90">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl transition backdrop-blur-md font-bold text-sm shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </GSAPReveal>

        {/* Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Navigation Tabs */}
          <GSAPReveal direction="right" distance={40} delay={0.2} stagger={0.05} className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2">
            {[
              { id: 'profile', icon: User, label: 'Account Details' },
              { id: 'orders', icon: ShoppingBag, label: 'Order History' },
              { id: 'addresses', icon: MapPin, label: 'Delivery Addresses' },
              { id: 'closet', icon: Sparkles, label: 'Virtual Closet' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl font-bold transition-all text-left w-full ${activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 translate-x-2'
                  : 'bg-white text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:translate-x-1 border border-gray-100 shadow-sm'
                  }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-purple-500'}`} />
                {tab.label}
              </button>
            ))}
          </GSAPReveal>

          {/* Main Content Pane */}
          <div className="flex-1">
            <GSAPTabTransition activeTab={activeTab}>
              {activeTab === 'profile' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-green-700 font-medium">{success}</p>
                    </div>
                  )}

                  {!isEditing ? (
                    <div>
                      <h2 className="text-xl font-black text-gray-900 mb-6">Personal Information</h2>
                      <GSAPReveal direction="up" stagger={0.1} className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="p-5 bg-slate-50 border border-gray-100 rounded-xl flex flex-col justify-center overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-5 h-5 text-purple-600 shrink-0" />
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone Number</p>
                          </div>
                          <p className="text-lg text-gray-900 font-bold truncate">{user.phone || "Not provided"}</p>
                        </div>

                        <div className="p-5 bg-slate-50 border border-gray-100 rounded-xl flex flex-col justify-center overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-purple-600 shrink-0" />
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Auth Method</p>
                          </div>
                          <p className="text-lg text-gray-900 font-bold capitalize truncate">{user.authMethod || "Registered Email"}</p>
                        </div>

                        <div className="p-5 bg-slate-50 border border-gray-100 rounded-xl flex flex-col justify-center overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-purple-600 shrink-0" />
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Member Since</p>
                          </div>
                          <p className="text-lg text-gray-900 font-bold truncate">{formatDate(user.createdAt)}</p>
                        </div>

                        <div className="p-5 bg-slate-50 border border-gray-100 rounded-xl flex flex-col justify-center overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-5 h-5 text-purple-600 shrink-0" />
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Primary Email</p>
                          </div>
                          <p className="text-lg text-gray-900 font-bold truncate" title={user.email}>{user.email}</p>
                        </div>
                      </GSAPReveal>
                      <div className="flex justify-start">
                        <button onClick={() => { setIsEditing(true); setError(""); }} className="flex items-center justify-center gap-2 bg-purple-600 text-white px-8 py-3.5 rounded-xl hover:bg-purple-700 transition font-bold shadow-lg shadow-purple-600/20">
                          <Edit2 className="w-5 h-5" /> Edit Profile Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="tracking-tight">
                      <h2 className="text-xl font-black text-gray-900 mb-6">Edit Profile</h2>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                          <input type="text" name="fullName" value={editData.fullName} onChange={handleEditChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition text-base" placeholder="Enter full name" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Email Address (Secured)</label>
                          <input type="email" value={user.email} disabled className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-base font-medium" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Mobile Phone Number</label>
                          <input type="tel" name="phone" value={editData.phone} onChange={handleEditChange} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition text-base" placeholder="Enter phone number" />
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3.5 rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition font-bold disabled:opacity-50">
                            <Save className="w-5 h-5" /> {loading ? "Updating..." : "Save Changes"}
                          </button>
                          <button type="button" onClick={() => { setIsEditing(false); setEditData({ fullName: user.fullName, phone: user.phone || "" }); setError(""); }} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-gray-700 px-6 py-3.5 rounded-xl hover:bg-slate-200 transition font-bold border border-slate-200">
                            <X className="w-5 h-5" /> Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'orders' && <OrderHistory />}
              {activeTab === 'addresses' && <AddressManagement />}

              {activeTab === 'closet' && (

                <VirtualCloset />

              )}
            </GSAPTabTransition>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
