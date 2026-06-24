import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import { FiSearch, FiEdit2, FiTrash2, FiUser, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ROLES = ['citizen', 'admin', 'department_head'];
const DEPARTMENTS = ['roads','water','electricity','sanitation','parks','health','general'];
const ROLE_BADGE = {
  citizen: 'bg-blue-100 text-blue-700',
  admin: 'bg-red-100 text-red-700',
  department_head: 'bg-purple-100 text-purple-700',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', search: '', page: 1 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [editModal, setEditModal] = useState(null);
  const [editData, setEditData] = useState({ role: '', isActive: true, department: '' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 20 };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await adminAPI.getUsers(params);
      setUsers(res.data);
      setPagination({ total: res.total, totalPages: res.totalPages || 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val, page: 1 }));
  };

  const openEdit = (user) => {
    setEditModal(user);
    setEditData({ role: user.role, isActive: user.isActive, department: user.department || '' });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminAPI.updateUser(editModal._id, editData);
      toast.success('User updated successfully');
      setEditModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      await adminAPI.updateUser(user._id, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This action cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(user._id);
      setUsers(prev => prev.filter(u => u._id !== user._id));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">{pagination.total} registered users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Citizens', icon: FiUser, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Dept. Heads', icon: FiShield, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Admins', icon: FiShield, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ label, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`${bg} ${color} w-10 h-10 rounded-xl flex items-center justify-center`}>
              <Icon className="text-lg" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {users.filter(u => u.role === label.toLowerCase().replace('. ','_').replace(' ','_').replace('.',' ')).length}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={filters.role} onChange={e => handleFilterChange('role', e.target.value)} className="input sm:w-44">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Ward / Dept</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[1,2,3,4,5,6].map(j => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded" /></td>)}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <FiUser className="text-4xl mx-auto mb-2 opacity-30" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`badge capitalize ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role?.replace('_',' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600 text-xs">
                    {user.ward && <span className="block">{user.ward}</span>}
                    {user.department && <span className="block capitalize text-purple-600">{user.department}</span>}
                    {!user.ward && !user.department && <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(user)} title="Edit user"
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button onClick={() => toggleActive(user)} title={user.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-2 rounded-lg transition-colors ${user.isActive
                          ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                        {user.isActive ? <FiUserX className="text-sm" /> : <FiUserCheck className="text-sm" />}
                      </button>
                      {user.role !== 'admin' && (
                        <button onClick={() => deleteUser(user)} title="Delete user"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="text-sm" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {filters.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => handleFilterChange('page', filters.page - 1)} disabled={filters.page === 1}
                className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
              <button onClick={() => handleFilterChange('page', filters.page + 1)} disabled={filters.page === pagination.totalPages}
                className="btn-secondary btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Edit User: {editModal.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{editModal.email}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="form-group">
                <label className="label">Role</label>
                <select value={editData.role} onChange={e => setEditData(prev => ({ ...prev, role: e.target.value }))} className="input">
                  {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ')}</option>)}
                </select>
              </div>
              {editData.role === 'department_head' && (
                <div className="form-group">
                  <label className="label">Department</label>
                  <select value={editData.department} onChange={e => setEditData(prev => ({ ...prev, department: e.target.value }))} className="input">
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="label">Account Status</label>
                <div className="flex gap-3">
                  {[true, false].map(val => (
                    <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={editData.isActive === val}
                        onChange={() => setEditData(prev => ({ ...prev, isActive: val }))}
                        className="text-primary-600" />
                      <span className="text-sm">{val ? 'Active' : 'Inactive'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1">
                {saving ? <span className="spinner" /> : null}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
