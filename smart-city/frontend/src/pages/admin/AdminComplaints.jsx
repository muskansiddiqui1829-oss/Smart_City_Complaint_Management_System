import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, complaintAPI } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import { format } from 'date-fns';
import { FiSearch, FiFilter, FiEye, FiChevronDown, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUSES = ['pending','under_review','in_progress','resolved','rejected','closed'];
const CATEGORIES = ['roads','water','electricity','sanitation','parks','health','general','noise','illegal_construction','public_transport'];
const PRIORITIES = ['low','medium','high','critical'];
const DEPARTMENTS = ['roads','water','electricity','sanitation','parks','health','general'];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', department: '', search: '', page: 1 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [showFilters, setShowFilters] = useState(true);
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await adminAPI.getAllComplaints(params);
      setComplaints(res.data);
      setPagination({ total: res.total, totalPages: res.totalPages });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelected(prev => prev.length === complaints.length ? [] : complaints.map(c => c._id));
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selected.length === 0) {
      toast.error('Select complaints and a status');
      return;
    }
    setBulkUpdating(true);
    try {
      await Promise.all(selected.map(id => complaintAPI.updateStatus(id, { status: bulkStatus, comment: `Bulk status update to ${bulkStatus}` })));
      toast.success(`${selected.length} complaints updated`);
      setSelected([]);
      fetchComplaints();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBulkUpdating(false);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Status', 'Priority', 'Citizen', 'Location', 'Date'];
    const rows = complaints.map(c => [
      c.complaintId, `"${c.title}"`, c.category, c.status, c.priority,
      c.citizen?.name || '', `"${c.location?.address || ''}"`,
      format(new Date(c.createdAt), 'yyyy-MM-dd'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaint Management</h1>
          <p className="text-gray-500 mt-1">{pagination.total} total complaints</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary btn-sm">
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="input pl-9"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary gap-2 ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : ''}`}>
            <FiFilter /> Filters <FiChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-gray-100">
            {[
              { label: 'Status', key: 'status', options: STATUSES },
              { label: 'Category', key: 'category', options: CATEGORIES },
              { label: 'Priority', key: 'priority', options: PRIORITIES },
              { label: 'Department', key: 'department', options: DEPARTMENTS },
            ].map(({ label, key, options }) => (
              <div key={key}>
                <label className="label text-xs">{label}</label>
                <select value={filters[key]} onChange={e => handleFilterChange(key, e.target.value)} className="input text-sm">
                  <option value="">All {label}s</option>
                  {options.map(o => <option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                </select>
              </div>
            ))}
            <div className="flex items-end">
              <button onClick={() => setFilters({ status:'',category:'',priority:'',department:'',search:'',page:1 })}
                className="btn-secondary btn-sm w-full">Clear All</button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-primary-800">{selected.length} selected</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="input text-sm w-44">
            <option value="">Change Status...</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
          <button onClick={handleBulkUpdate} disabled={bulkUpdating} className="btn-primary btn-sm">
            {bulkUpdating ? <span className="spinner" /> : null}
            Apply
          </button>
          <button onClick={() => setSelected([])} className="btn-secondary btn-sm ml-auto">Cancel</button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.length === complaints.length && complaints.length > 0}
                    onChange={selectAll} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Complaint</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">Citizen</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden xl:table-cell">Date</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[1,2,3,4,5,6,7,8].map(j => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <FiSearch className="text-4xl mx-auto mb-2 opacity-30" />
                    <p>No complaints found</p>
                  </td>
                </tr>
              ) : complaints.map(c => (
                <tr key={c._id} className={`hover:bg-gray-50 transition-colors ${selected.includes(c._id) ? 'bg-primary-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(c._id)}
                      onChange={() => toggleSelect(c._id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-xs truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 font-mono">{c.complaintId}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-gray-700">{c.citizen?.name || 'Anonymous'}</p>
                    {c.citizen?.ward && <p className="text-xs text-gray-400">{c.citizen.ward}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="capitalize text-gray-600">{c.category?.replace('_',' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <StatusBadge status={c.priority} type="priority" />
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden xl:table-cell text-xs">
                    {format(new Date(c.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/admin/complaints/${c._id}`}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-block">
                      <FiEye />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {((filters.page - 1) * 20) + 1}–{Math.min(filters.page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleFilterChange('page', filters.page - 1)} disabled={filters.page === 1}
                className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
              <span className="btn-secondary btn-sm pointer-events-none">{filters.page} / {pagination.totalPages}</span>
              <button onClick={() => handleFilterChange('page', filters.page + 1)} disabled={filters.page === pagination.totalPages}
                className="btn-secondary btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
