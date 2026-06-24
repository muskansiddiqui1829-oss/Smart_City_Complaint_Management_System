import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiSave } from 'react-icons/fi';

const profileSchema = z.object({
  name: z.string().min(2, 'Min 2 characters').max(50),
  phone: z.string().optional(),
  ward: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/\d/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      ward: user?.ward || '',
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
    },
  });

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
    setError: setPasswordError,
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const onSaveProfile = async (data) => {
    setSavingProfile(true);
    try {
      await updateProfile({
        name: data.name,
        phone: data.phone,
        ward: data.ward,
        address: { street: data.street, city: data.city, state: data.state, pincode: data.pincode },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const onSavePassword = async (data) => {
    setSavingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully!');
      resetPassword();
    } catch (err) {
      if (err.message.includes('incorrect')) {
        setPasswordError('currentPassword', { message: 'Current password is incorrect' });
      } else {
        toast.error(err.message);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'password', label: 'Password', icon: FiLock },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
      </div>

      {/* Profile Header Card */}
      <div className="card p-6 mb-5 flex items-center gap-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-lg">{user?.name}</h2>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            <FiMail className="text-xs" /> {user?.email}
          </p>
          <span className={`badge mt-1 capitalize
            ${user?.role === 'admin' ? 'bg-red-100 text-red-700' :
              user?.role === 'department_head' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'}`}>
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all
                ${activeTab === id
                  ? 'text-primary-700 border-b-2 border-primary-700 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
              <Icon className="text-base" /> {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfile(onSaveProfile)} className="space-y-5 animate-fade-in">
              <div className="form-group">
                <label className="label">Full Name *</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input {...regProfile('name')}
                    className={`input pl-9 ${profileErrors.name ? 'input-error' : ''}`} />
                </div>
                {profileErrors.name && <p className="error-msg">{profileErrors.name.message}</p>}
              </div>

              <div className="form-group">
                <label className="label">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input value={user?.email} disabled className="input pl-9 bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input {...regProfile('phone')} className="input pl-9" placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Ward Number</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input {...regProfile('ward')} className="input pl-9" placeholder="e.g. Ward 12" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Address</p>
                <div className="space-y-3">
                  <input {...regProfile('street')} className="input" placeholder="Street address" />
                  <div className="grid grid-cols-2 gap-3">
                    <input {...regProfile('city')} className="input" placeholder="City" />
                    <input {...regProfile('state')} className="input" placeholder="State" />
                  </div>
                  <input {...regProfile('pincode')} className="input" placeholder="Pincode" />
                </div>
              </div>

              <button type="submit" disabled={savingProfile} className="btn-primary w-full">
                {savingProfile ? <span className="spinner" /> : <FiSave />}
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePassword(onSavePassword)} className="space-y-5 animate-fade-in">
              <div className="form-group">
                <label className="label">Current Password *</label>
                <input {...regPassword('currentPassword')} type="password"
                  className={`input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                  placeholder="Enter current password" />
                {passwordErrors.currentPassword && (
                  <p className="error-msg">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="label">New Password *</label>
                <input {...regPassword('newPassword')} type="password"
                  className={`input ${passwordErrors.newPassword ? 'input-error' : ''}`}
                  placeholder="Min 8 chars, uppercase, number" />
                {passwordErrors.newPassword && (
                  <p className="error-msg">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="label">Confirm New Password *</label>
                <input {...regPassword('confirmPassword')} type="password"
                  className={`input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Repeat new password" />
                {passwordErrors.confirmPassword && (
                  <p className="error-msg">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-xs text-blue-700 font-medium mb-2">Password requirements:</p>
                <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter (A-Z)</li>
                  <li>One lowercase letter (a-z)</li>
                  <li>One number (0-9)</li>
                </ul>
              </div>

              <button type="submit" disabled={savingPassword} className="btn-primary w-full">
                {savingPassword ? <span className="spinner" /> : <FiLock />}
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
