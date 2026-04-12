import { useState, useEffect } from 'react';

import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context api/AuthContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {

  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      if (err.message.toLowerCase().includes('not found')) {
        setError('No account found with this email address');
      } else {
        setError(err.message || 'Failed to send password reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-xl max-w-md">
            <Link to="/" className="inline-flex items-center text-purple-600 hover:text-pink-600 transition mb-6">
              <span className="text-sm">← Back to Home</span>
            </Link>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
              <p className="text-gray-600 mb-4">
                We've sent a password reset link to <strong>{email}</strong>.
                It may take a few minutes to arrive. Check your spam folder if you don't see it.
              </p>

              <Link
                to="/login"
                className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-xl max-w-md">
          <Link to="/login" className="inline-flex items-center text-purple-600 hover:text-pink-600 transition mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm">Back to Sign In</span>
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-600">Enter your email to receive reset instructions</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg flex items-center gap-3 bg-red-100 text-red-800 border border-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Sending Instructions...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-purple-600 font-medium hover:text-pink-600">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
