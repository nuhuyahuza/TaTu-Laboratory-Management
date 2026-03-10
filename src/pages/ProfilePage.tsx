import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'motion/react';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (user) {
        // Update Firebase Auth Profile
        await updateProfile(user, { displayName: formData.name });
        
        // Update Firestore Profile
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { name: formData.name });
        
        await refreshProfile();
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, formData.newPassword);
        
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
        setMessage({ type: 'success', text: 'Password updated successfully!' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (limit to 1MB for base64 storage in Firestore)
    if (file.size > 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 1MB' });
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Update Firebase Auth
        await updateProfile(user, { photoURL: base64String });
        
        // Update Firestore
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { photoURL: base64String });
        
        await refreshProfile();
        setMessage({ type: 'success', text: 'Profile picture updated!' });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update photo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Account Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal information and security preferences.</p>
        </div>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center space-x-3 ${
            message.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 text-center transition-colors">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  profile?.name?.charAt(0)
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors border-2 border-white dark:border-slate-900 cursor-pointer">
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} disabled={loading} />
              </label>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm capitalize mb-6">{profile?.role}</p>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <Shield size={18} className="text-emerald-600" />
                <span>Role: <span className="font-semibold capitalize">{profile?.role}</span></span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                <Briefcase size={18} className="text-emerald-600" />
                <span>Dept: <span className="font-semibold">{profile?.department || 'N/A'}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <User size={22} className="mr-2 text-emerald-600" />
              Personal Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-slate-800/50 border-none rounded-2xl text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center"
                >
                  {loading && <Loader2 className="animate-spin mr-2" size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Lock size={22} className="mr-2 text-emerald-600" />
              Security & Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password"
                    required
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                    placeholder="Enter current password to verify"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="password"
                      required
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                      placeholder="Min. 6 characters"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center"
                >
                  {loading && <Loader2 className="animate-spin mr-2" size={18} />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
