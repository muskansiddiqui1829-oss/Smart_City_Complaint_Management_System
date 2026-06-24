import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { FiUsers, FiFileText, FiCheckCircle, FiTrendingUp, FiStar, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import StatusBadge from '../../components/ui/StatusBadge';

const COLORS = ['#1d4ed8','#7c3aed','#059669','#d97706','#dc2626','#6b7280'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics()
      .then(res => setAnalytics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card p-6 h-28 bg-gray-100" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-6 h-72 bg-gray-100" />
          <div className="card p-6 h-72 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { overview, byStatus, byCategory, byPriority, byDepartment, monthlyTrends, topWards } = analytics;

  const statusData = Object.entries(byStatus || {}).map(([name, value]) => ({ name: name.replace('_',' '), value }));
  const categoryData = (byCategory || []).map(c => ({ name: c._id?.replace('_',' '), value: c.count }));
  const monthlyData = (monthlyTrends || []).map(m => ({
    month: MONTH_NAMES[m._id.month - 1],
    complaints: m.count,
  }));
  const deptData = (byDepartment || []).map(d => ({
    dept: d._id || 'unknown',
    total: d.count,
    resolved: d.resolved,
  }));

  const overviewCards = [
    { label: 'Total Citizens', value: overview?.totalUsers?.toLocaleString(), icon: FiUsers, color: 'text-blue-600', bg: 'bg-blue-50', sub: `+${overview?.newUsersThisMonth} this month` },
    { label: 'Total Complaints', value: overview?.totalComplaints?.toLocaleString(), icon: FiFileText, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'All time' },
    { label: 'Resolution Rate', value: `${overview?.resolutionRate}%`, icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-50', sub: 'Complaints resolved' },
    { label: 'Avg Resolution', value: `${overview?.avgResolutionDays}d`, icon: FiClock, color: 'text-orange-600', bg: 'bg-orange-50', sub: 'Days to resolve' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and analytics</p>
        </div>
        <div className="flex gap-3">
          {overview?.avgSatisfactionScore > 0 && (
            <div className="card px-4 py-2 flex items-center gap-2 text-sm">
              <FiStar className="text-yellow-400" />
              <span className="font-semibold">{overview.avgSatisfactionScore}/5</span>
              <span className="text-gray-400">avg rating</span>
            </div>
          )}
          <Link to="/admin/complaints" className="btn-primary btn-sm">View All Complaints</Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`${bg} ${color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <Icon className="text-lg" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600 font-medium">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Complaints</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="complaints" stroke="#1d4ed8" strokeWidth={2.5}
                dot={{ fill: '#1d4ed8', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Status Breakdown</h2>
          <div className="flex items-center">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={2}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statusData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 capitalize">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">By Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData.slice(0, 7)} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Performance */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Department Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData.slice(0, 6)} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#1d4ed8" name="Total" radius={[3,3,0,0]} />
              <Bar dataKey="resolved" fill="#059669" name="Resolved" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Wards */}
      {topWards?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Top Complaint Areas (Wards)</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topWards.slice(0, 10).map((ward, idx) => (
              <div key={ward._id || idx} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-primary-700">{ward.count}</p>
                <p className="text-xs text-gray-600 truncate">{ward._id || 'Unknown Ward'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
