import { useState, useEffect } from 'react';

import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Check if reset email exists
  useEffect(() => {
    const resetEmail = localStorage.getItem('resetEmail');
    if (!resetEmail) {
      setError('Invalid reset request. Please request a new password reset.');
    }

  }, []);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setError('');

    // Calculate password strength
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
    if (/\d/.test(value)) strength++;
    if (/[!@#$%^&*]/.test(value)) strength++;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const resetEmail = localStorage.getItem('resetEmail');
        
        if (!resetEmail) {
          setError('Invalid reset request. Please request a new password reset.');
          setLoading(false);
          return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === resetEmail);

        if (userIndex !== -1) {
          // Update password in localStorage
          users[userIndex].password = btoa(password); // Simple encoding
          localStorage.setItem('users', JSON.stringify(users));
          localStorage.removeItem('resetEmail');
          
          setSuccess('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        } else {
          setError('User not found');
        }
      } catch (err) {
        setError('An error occurred while resetting password');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const getPasswordStrengthColor = () => {
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
    return colors[passwordStrength];
  };

  const getPasswordStrengthText = () => {
    const text = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return text[passwordStrength];
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-xl max-w-md">
          <Link to="/login" className="inline-flex items-center text-purple-600 hover:text-pink-600 transition mb-6">
            <span className="text-sm">← Back to Sign In</span>
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
              <p className="text-gray-600">Enter a new password for your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg flex items-center gap-3 bg-red-100 text-red-800 border border-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-lg flex items-center gap-3 bg-green-100 text-green-800 border border-green-300">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded ${
                              i <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">
                        Strength: <span className="font-semibold">{getPasswordStrengthText()}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

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
