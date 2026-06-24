import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import {
  FiHome, FiFileText, FiPlusCircle, FiUser, FiBell,
  FiLogOut, FiMenu, FiX, FiShield, FiChevronDown,
} from 'react-icons/fi';
import { MdLocationCity } from 'react-icons/md';

export default function Layout() {
  const { user, logout, isAdmin, isDepartmentHead } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationAPI.getAll({ unreadOnly: 'true', limit: 1 })
      .then(res => setUnreadCount(res.unreadCount || 0))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/complaints', icon: FiFileText, label: 'My Complaints' },
    { to: '/complaints/submit', icon: FiPlusCircle, label: 'Submit Complaint' },
    { to: '/notifications', icon: FiBell, label: 'Notifications', badge: unreadCount },
    { to: '/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
              <MdLocationCity className="text-white text-xl" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Smart City</p>
              <p className="text-xs text-gray-500">Complaint Platform</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="text-lg shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </NavLink>
          ))}

          {(isAdmin || isDepartmentHead) && (
            <div className="pt-3 border-t border-gray-100 mt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Admin</p>
              <NavLink
                to="/admin"
                className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
                onClick={() => setSidebarOpen(false)}
              >
                <FiShield className="text-lg shrink-0" />
                <span>Admin Panel</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary w-full btn-sm">
            <FiLogOut className="text-base" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:px-6 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <FiMenu className="text-xl text-gray-600" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-gray-800 font-semibold text-sm">Smart City Complaint Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <FiBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </NavLink>
            <NavLink to="/profile" className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2">
              <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
