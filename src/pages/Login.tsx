import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, ArrowLeft, User, Mail, Phone, Lock, UserCircle, Activity, Loader2, Eye, EyeOff } from 'lucide-react';
import emailjs from '@emailjs/browser';
import api from '../lib/api';

interface LoginProps {
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'parent',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation for null values
    if (!formData.email || !formData.password) {
      setError('email or password cannot be null values');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!formData.firstName || !formData.lastName || !formData.phone) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        await api.post('/api/users/register/', {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phone,
          role: formData.role,
          password: formData.password,
          password_confirmation: formData.confirmPassword, // Keeping this as primary
          confirm_password: formData.confirmPassword // Adding as fallback for some backends
        });
        
        // Send confirmation email
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          const emailParams = {
            user_name: `${formData.firstName} ${formData.lastName}`,
            user_email: formData.email,
            to_email: formData.email, // Common alias for recipient
            email: formData.email,    // Common alias for recipient
            message: "Your account was created successfully! Welcome to SPECTRA.",
            app_name: "SPECTRA"
          };
          
          console.log('[Login] Attempting to send confirmation email to:', formData.email);

          try {
            await emailjs.send(
              serviceId,
              templateId,
              emailParams,
              publicKey
            );
            console.log('[Login] Confirmation email sent successfully');
          } catch (emailErr) {
            console.error('[Login] Failed to send confirmation email:', emailErr);
          }
        } else {
          console.warn('[Login] EmailJS not configured. Skipping confirmation email.');
        }

        // After signup, switch to login
        setIsSignUp(false);
        setError('Account created! Please sign in.');
      } else {
        const response = await api.post('/api/users/login/', {
          email: formData.email,
          password: formData.password
        });
        
        const { access, refresh, role } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user_email', formData.email);
        if (role) localStorage.setItem('user_role', role);
        else {
          const userRole = response.data.user?.role || response.data.role || 'parent';
          localStorage.setItem('user_role', userRole);
        }
        
        // Redirect to child profile or home
        onBack();
      }
    } catch (err: any) {
      const is401 = err.response?.status === 401;
      
      // Only log as error if it's not a common auth/validation failure (400, 401, 404 for missing account)
      if (err.response?.status && ![400, 401, 404].includes(err.response.status)) {
        console.error('Auth error:', err);
      } else if (!err.response) {
        console.error('Network/Connection error:', err);
      }

      let errorMsg = 'Authentication failed. Please try again.';
      
      const errorData = err.response?.data;
      const detail = errorData?.detail || errorData?.message || errorData?.error || '';
      const detailLower = typeof detail === 'string' ? detail.toLowerCase() : '';
      
      if (err.response?.status === 401 || detailLower === 'invalid credentials' || detailLower.includes('credential')) {
        errorMsg = 'invalid credentials';
      } else if (err.response?.status === 404 || detailLower.includes('email') || detailLower.includes('user not found') || detailLower.includes('no user')) {
        errorMsg = "the email address doesn't exist";
      } else if (err.response?.status === 400) {
        // Handle field-specific validation errors from backend
        if (errorData && typeof errorData === 'object' && !errorData.error) {
          if (errorData.email) {
            errorMsg = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
          } else if (errorData.password) {
            errorMsg = 'the password is invalid';
          } else if (errorData.non_field_errors) {
            const nfe = errorData.non_field_errors;
            errorMsg = Array.isArray(nfe) ? nfe[0] : nfe;
          } else {
            const firstKey = Object.keys(errorData)[0];
            const firstVal = errorData[firstKey];
            if (firstKey && firstVal) {
              errorMsg = Array.isArray(firstVal) ? `${firstKey}: ${firstVal[0]}` : String(firstVal);
            } else {
              errorMsg = 'the email address is invalid'; // Default per user request
            }
          }
        } else {
          errorMsg = 'the email address is invalid';
        }
      } else if (err.response?.status === 404) {
        errorMsg = `Endpoint not found (404). Please verify the backend URL and path. (Tried: ${err.config.url})`;
      } else if (err.response?.data) {
        errorMsg = err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-anadaa-50 flex flex-col">
      <nav className="p-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-anadaa-600 hover:text-anadaa-900 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-anadaa-700 rounded-2xl text-white shadow-xl mb-6">
              <Brain size={32} />
            </div>
            <h1 className="text-3xl font-display font-bold text-anadaa-900">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p className="text-anadaa-500 mt-2">
              {isSignUp 
                ? 'Join SPECTRA to track your child\'s journey.' 
                : 'Sign in to access your reports and resources.'}
            </p>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] shadow-xl border border-anadaa-100">
            {error && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${error.includes('created') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-anadaa-400 ml-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="John"
                        className="w-full pl-12 pr-4 py-3 bg-anadaa-50 border border-anadaa-100 rounded-xl focus:ring-2 focus:ring-anadaa-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-anadaa-400 ml-1">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="Doe"
                        className="w-full pl-12 pr-4 py-3 bg-anadaa-50 border border-anadaa-100 rounded-xl focus:ring-2 focus:ring-anadaa-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-anadaa-400 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="name@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-anadaa-50 border border-anadaa-100 rounded-xl focus:ring-2 focus:ring-anadaa-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={loading}
                  />
                </div>
              </div>

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-anadaa-400 ml-1">I am a...</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setFormData({...formData, role: 'parent'})}
                        className={`py-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-medium ${
                          formData.role === 'parent' 
                            ? 'bg-anadaa-700 text-white border-anadaa-700 shadow-md' 
                            : 'bg-white text-anadaa-600 border-anadaa-100 hover:border-anadaa-300'
                        } disabled:opacity-50`}
                      >
                        <UserCircle size={18} /> Parent
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setFormData({...formData, role: 'doctor'})}
                        className={`py-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-medium ${
                          formData.role === 'doctor' 
                            ? 'bg-anadaa-700 text-white border-anadaa-700 shadow-md' 
                            : 'bg-white text-anadaa-600 border-anadaa-100 hover:border-anadaa-300'
                        } disabled:opacity-50`}
                      >
                        <Activity size={18} /> Doctor
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-anadaa-400 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300" size={18} />
                      <input 
                        type="tel" 
                        required
                        placeholder="01012345678"
                        className="w-full pl-12 pr-4 py-3 bg-anadaa-50 border border-anadaa-100 rounded-xl focus:ring-2 focus:ring-anadaa-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-anadaa-400 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-anadaa-50 border border-anadaa-100 rounded-xl focus:ring-2 focus:ring-anadaa-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-anadaa-400 hover:text-anadaa-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-anadaa-400 ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300" size={18} />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 bg-anadaa-50 border border-anadaa-100 rounded-xl focus:ring-2 focus:ring-anadaa-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-anadaa-400 hover:text-anadaa-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-anadaa-700 text-white rounded-xl font-bold shadow-lg hover:bg-anadaa-800 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-anadaa-500 text-sm">
                {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-2 text-anadaa-700 font-bold hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
