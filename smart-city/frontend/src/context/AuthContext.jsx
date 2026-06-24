import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const saveUser = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) localStorage.setItem('token', token);
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Validate stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(res => { saveUser(res.data); })
        .catch(() => { clearUser(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    saveUser(res.data, res.token);
    toast.success('Account created successfully!');
    return res;
  }, []);

  const login = useCallback(async (data) => {
    const res = await authAPI.login(data);
    saveUser(res.data, res.token);
    toast.success(`Welcome back, ${res.data.name}!`);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    clearUser();
    toast.success('Logged out successfully');
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await authAPI.updateProfile(data);
    saveUser(res.data);
    toast.success('Profile updated!');
    return res;
  }, []);

  const isAdmin = user?.role === 'admin';
  const isDepartmentHead = user?.role === 'department_head';
  const isCitizen = user?.role === 'citizen';

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin, isDepartmentHead, isCitizen,
      register, login, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
