import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCircle,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'email' | 'password'>('info');

  // Form states
  const [infoForm, setInfoForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: ''
  });
  const [emailForm, setEmailForm] = useState({
    email: '',
    current_password: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/users/profile/');
      setProfile(response.data);
      setInfoForm({
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        phone_number: response.data.phone_number || ''
      });
      setEmailForm({
        email: response.data.email || '',
        current_password: ''
      });
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch('/api/users/profile/', infoForm);
      setSuccessMsg('Profile information updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch('/api/users/profile/', emailForm);
      setSuccessMsg('Email updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setEmailForm(prev => ({ ...prev, current_password: '' }));
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to update email.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.patch('/api/users/profile/', passwordForm);
      setSuccessMsg('Password changed successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-anadaa-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-anadaa-700 mb-4 mx-auto" size={48} />
          <p className="text-anadaa-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-anadaa-50 font-sans pb-20">
      <nav className="p-6 flex justify-between items-center max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-anadaa-600 hover:text-anadaa-900 transition-colors font-medium group"
        >
          <div className="p-2 rounded-lg group-hover:bg-anadaa-100 transition-colors">
            <ArrowLeft size={20} />
          </div>
          Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <UserCircle size={24} className="text-anadaa-900" />
          <span className="font-display font-bold text-lg tracking-tight text-anadaa-900">User Account</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Tabs */}
          <div className="md:w-64 shrink-0">
            <div className="glass-card p-4 rounded-3xl space-y-2">
              <button 
                onClick={() => setActiveTab('info')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'info' ? 'bg-anadaa-900 text-white shadow-lg' : 'text-anadaa-500 hover:bg-anadaa-50'}`}
              >
                <User size={18} /> Profile Info
              </button>
              <button 
                onClick={() => setActiveTab('email')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'email' ? 'bg-anadaa-900 text-white shadow-lg' : 'text-anadaa-500 hover:bg-anadaa-50'}`}
              >
                <Mail size={18} /> Change Email
              </button>
              <button 
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'password' ? 'bg-anadaa-900 text-white shadow-lg' : 'text-anadaa-500 hover:bg-anadaa-50'}`}
              >
                <Lock size={18} /> Security
              </button>
            </div>

            {profile && (
              <div className="mt-8 p-6 glass-card rounded-3xl text-center">
                <div className="w-20 h-20 bg-anadaa-100 rounded-full flex items-center justify-center text-anadaa-900 mx-auto mb-4">
                  <span className="text-2xl font-display font-bold">
                    {(profile.first_name?.[0] || '') + (profile.last_name?.[0] || '') || 'U'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-anadaa-900">
                  {profile.first_name} {profile.last_name}
                </h3>
                <p className="text-xs text-anadaa-400 mt-1 uppercase tracking-widest font-bold">
                  {localStorage.getItem('user_role') || 'User'}
                </p>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-anadaa-100 min-h-[400px]"
              >
                {/* Success/Error Alerts */}
                {successMsg && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center gap-3 animate-slide-up">
                    <CheckCircle2 size={20} className="shrink-0" />
                    <span className="text-sm font-medium">{successMsg}</span>
                  </div>
                )}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3 animate-slide-up">
                    <AlertCircle size={20} className="shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                {activeTab === 'info' && (
                  <section>
                    <h2 className="text-2xl font-display font-bold text-anadaa-900 mb-2">Profile Information</h2>
                    <p className="text-anadaa-500 text-sm mb-8">Update your personal details and contact information.</p>
                    
                    <form onSubmit={handleInfoUpdate} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-anadaa-400 ml-1">First Name</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300">
                              <User size={18} />
                            </span>
                            <input 
                              type="text" 
                              required
                              className="w-full pl-12 pr-4 py-3 bg-anadaa-50/50 border border-anadaa-100 rounded-2xl outline-none focus:ring-2 focus:ring-anadaa-200 transition-all"
                              value={infoForm.first_name}
                              onChange={(e) => setInfoForm({ ...infoForm, first_name: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-anadaa-400 ml-1">Last Name</label>
                          <input 
                            type="text" 
                            required
                            className="w-full px-4 py-3 bg-anadaa-50/50 border border-anadaa-100 rounded-2xl outline-none focus:ring-2 focus:ring-anadaa-200 transition-all"
                            value={infoForm.last_name}
                            onChange={(e) => setInfoForm({ ...infoForm, last_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-anadaa-400 ml-1">Phone Number</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300">
                            <Phone size={18} />
                          </span>
                          <input 
                            type="tel" 
                            className="w-full pl-12 pr-4 py-3 bg-anadaa-50/50 border border-anadaa-100 rounded-2xl outline-none focus:ring-2 focus:ring-anadaa-200 transition-all"
                            value={infoForm.phone_number}
                            onChange={(e) => setInfoForm({ ...infoForm, phone_number: e.target.value })}
                            placeholder="e.g. 01099999999"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit"
                          disabled={saving}
                          className="w-full md:w-auto px-8 py-4 bg-anadaa-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                          Save Profile Info
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {activeTab === 'email' && (
                  <section>
                    <h2 className="text-2xl font-display font-bold text-anadaa-900 mb-2">Change Email Address</h2>
                    <p className="text-anadaa-500 text-sm mb-8">Update your login email. You will need to provide your current password for security.</p>
                    
                    <form onSubmit={handleEmailUpdate} className="space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-anadaa-400 ml-1">New Email Address</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300">
                            <Mail size={18} />
                          </span>
                          <input 
                            type="email" 
                            required
                            className="w-full pl-12 pr-4 py-3 bg-anadaa-50/50 border border-anadaa-100 rounded-2xl outline-none focus:ring-2 focus:ring-anadaa-200 transition-all"
                            value={emailForm.email}
                            onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-anadaa-400 ml-1">Current Password</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300">
                            <Lock size={18} />
                          </span>
                          <input 
                            type={showPwd.current ? "text" : "password"} 
                            required
                            className="w-full pl-12 pr-12 py-3 bg-anadaa-50/50 border border-anadaa-100 rounded-2xl outline-none focus:ring-2 focus:ring-anadaa-200 transition-all"
                            value={emailForm.current_password}
                            onChange={(e) => setEmailForm({ ...emailForm, current_password: e.target.value })}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPwd(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-anadaa-400 hover:text-anadaa-900"
                          >
                            {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit"
                          disabled={saving}
                          className="w-full md:w-auto px-8 py-4 bg-anadaa-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                          Update Email
                        </button>
                      </div>
                    </form>
                  </section>
                )}

                {activeTab === 'password' && (
                  <section>
                    <h2 className="text-2xl font-display font-bold text-anadaa-900 mb-2">Change Password</h2>
                    <p className="text-anadaa-500 text-sm mb-8">Ensure your account is secure by using a strong password.</p>
                    
                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-anadaa-400 ml-1">Current Password</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-anadaa-300">
                             <Lock size={18} />
                          </span>
                          <input 
                            type={showPwd.current ? "text" : "password"} 
                            required
                            className="w-full pl-12 pr-12 py-3 bg-anadaa-50/50 border border-anadaa-100 rounded-2xl outline-none focus:ring-2 focus:ring-anadaa-200 transition-all"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPwd(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-anadaa-400 hover:text-anadaa-900"
                          >
                            {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-anadaa-400 ml-1">New Password</label>
                          <div className="relative">
                            <input 
                              type={showPwd.new ? "text" : "password"} 
                              required
                              className="w-full px-4 py-3 bg-anadaa-50/50 border border-anadaa-100 rounded-2xl outline-none focus:ring-2 focus:ring-anadaa-200 transition-all"
                              value={passwordForm.new_password}
                              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPwd(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-anadaa-400 hover:text-anadaa-900"
                            >
                              {showPwd.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-anadaa-400 ml-1">Confirm New Password</label>
                          <div className="relative">
                            <input 
                              type={showPwd.confirm ? "text" : "password"} 
                              required
                              className="w-full px-4 py-3 bg-anadaa-50/50 border border-anadaa-100 rounded-2xl outline-none focus:ring-2 focus:ring-anadaa-200 transition-all"
                              value={passwordForm.new_password_confirmation}
                              onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPwd(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-anadaa-400 hover:text-anadaa-900"
                            >
                              {showPwd.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit"
                          disabled={saving}
                          className="w-full md:w-auto px-8 py-4 bg-anadaa-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
                          Save New Password
                        </button>
                      </div>
                    </form>
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
