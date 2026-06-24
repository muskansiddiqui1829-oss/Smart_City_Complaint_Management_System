import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiBarChart2, FiFileText, FiUsers, FiMenu, FiLogOut, FiHome,
} from 'react-icons/fi';
import { MdLocationCity } from 'react-icons/md';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/admin', icon: FiBarChart2, label: 'Dashboard', end: true },
    { to: '/admin/complaints', icon: FiFileText, label: 'Complaints' },
    { to: '/admin/users', icon: FiUsers, label: 'Users' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-700 z-30 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-5 border-b border-gray-700">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <MdLocationCity className="text-white text-xl" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Smart City</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="text-lg shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="pt-3 border-t border-gray-700 mt-3">
            <NavLink
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
            >
              <FiHome className="text-lg shrink-0" />
              Citizen View
            </NavLink>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
            <FiLogOut /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between lg:px-6 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-700 text-gray-400">
            <FiMenu className="text-xl" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-white font-semibold text-sm">Administration Portal</h1>
          </div>
          <div className="text-gray-400 text-sm">
            <span className="bg-green-500 w-2 h-2 rounded-full inline-block mr-2" />
            System Online
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
