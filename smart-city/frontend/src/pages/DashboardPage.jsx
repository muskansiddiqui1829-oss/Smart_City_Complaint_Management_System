import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiPlusCircle, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import StatusBadge from '../components/ui/StatusBadge';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintAPI.getStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Complaints', value: stats.total, icon: FiFileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Resolved', value: stats.byStatus?.resolved || 0, icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'In Progress', value: (stats.byStatus?.in_progress || 0) + (stats.byStatus?.under_review || 0), icon: FiClock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Pending', value: stats.byStatus?.pending || 0, icon: FiAlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ] : [];

  const chartData = stats?.monthly?.map(m => ({
    month: MONTH_NAMES[(m._id.month - 1)],
    complaints: m.count,
  })) || [];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card p-6 h-28 bg-gray-100" />)}
        </div>
        <div className="card p-6 h-64 bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's an overview of your complaints</p>
        </div>
        <Link to="/complaints/submit" className="btn-primary">
          <FiPlusCircle /> Submit Complaint
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              </div>
              <div className={`${bg} ${color} w-11 h-11 rounded-xl flex items-center justify-center`}>
                <Icon className="text-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly Chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Complaints Over Time</h2>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="complaints" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FiTrendingUp className="text-4xl mx-auto mb-2 opacity-30" />
                <p className="text-sm">No complaint data yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">By Category</h2>
          {stats?.byCategory?.length > 0 ? (
            <div className="space-y-3">
              {stats.byCategory.slice(0, 6).map(({ _id, count }) => (
                <div key={_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 capitalize">{_id?.replace('_', ' ')}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-700"
                      style={{ width: `${Math.round((count / stats.total) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Complaints */}
      {stats?.recentComplaints?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Complaints</h2>
            <Link to="/complaints" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentComplaints.map(c => (
              <Link key={c._id} to={`/complaints/${c._id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.complaintId} · {format(new Date(c.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats?.total === 0 && (
        <div className="card p-12 text-center">
          <FiFileText className="text-5xl text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No complaints yet</h3>
          <p className="text-gray-400 text-sm mb-6">Submit your first complaint to get started</p>
          <Link to="/complaints/submit" className="btn-primary">
            <FiPlusCircle /> Submit First Complaint
          </Link>
        </div>
      )}
    </div>
  );
}
