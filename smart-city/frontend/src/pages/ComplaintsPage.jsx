import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { complaintAPI } from '../services/api';
import { FiPlusCircle, FiSearch, FiFilter, FiMapPin, FiThumbsUp, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['roads','water','electricity','sanitation','parks','health','general','noise','illegal_construction','public_transport'];
const STATUSES = ['pending','under_review','in_progress','resolved','rejected','closed'];

export default function ComplaintsPage() {
  const { isAdmin, isDepartmentHead } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', search: '', page: 1 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [showFilters, setShowFilters] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 12 };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const api = isAdmin || isDepartmentHead ? complaintAPI.getAll : complaintAPI.getAll;
      const res = await api(params);
      setComplaints(res.data);
      setPagination({ total: res.total, totalPages: res.totalPages });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin, isDepartmentHead]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-gray-500 mt-1">{pagination.total} total complaints</p>
        </div>
        <Link to="/complaints/submit" className="btn-primary">
          <FiPlusCircle /> New Complaint
        </Link>
      </div>

      {/* Search + Filter Bar */}
      <div className="card p-4">
        <div className="flex gap-3 flex-col sm:flex-row">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary gap-2 ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : ''}`}
          >
            <FiFilter /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="label text-xs">Status</label>
              <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="input text-sm">
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Category</label>
              <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="input text-sm">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => setFilters({ status: '', category: '', search: '', page: 1 })}
                className="btn-secondary btn-sm w-full">Clear Filters</button>
            </div>
          </div>
        )}
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="card p-12 text-center">
          <FiSearch className="text-5xl text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No complaints found</h3>
          <p className="text-gray-400 text-sm mb-6">Try adjusting your filters or submit a new complaint</p>
          <Link to="/complaints/submit" className="btn-primary">Submit Complaint</Link>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.map(c => (
              <Link key={c._id} to={`/complaints/${c._id}`}
                className="card p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 block group">
                <div className="flex items-start justify-between mb-3">
                  <StatusBadge status={c.status} />
                  <StatusBadge status={c.priority} type="priority" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-700 transition-colors">
                  {c.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{c.description}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                  <FiMapPin className="shrink-0" />
                  <span className="truncate">{c.location?.address}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><FiThumbsUp /> {c.upvoteCount || 0}</span>
                    <span className="flex items-center gap-1"><FiEye /> {c.views || 0}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-primary-600 font-medium">{c.complaintId}</p>
                    <p className="text-xs text-gray-400">{format(new Date(c.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page === 1}
                className="btn-secondary btn-sm disabled:opacity-40"
              >Previous</button>
              <span className="text-sm text-gray-600">
                Page {filters.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page === pagination.totalPages}
                className="btn-secondary btn-sm disabled:opacity-40"
              >Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
