import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OfficerCard from '../ui/OfficerCard';

const ManageOfficersPage = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    designation: '',
    isAvailable: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'police',
    department: 'roads',
    station: '',
    bio: '',
    wards: '',
  });

  useEffect(() => {
    fetchOfficers();
  }, [filters]);

  const fetchOfficers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.designation) params.designation = filters.designation;
      if (filters.isAvailable) params.isAvailable = filters.isAvailable;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/officers`,
        {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setOfficers(response.data.data || []);
    } catch (err) {
      setError('Failed to load officers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        jurisdiction: {
          wards: formData.wards ? formData.wards.split(',').map((w) => w.trim()) : [],
          city: 'Smart City',
        },
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/officers`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setShowCreateForm(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        designation: 'police',
        department: 'roads',
        station: '',
        bio: '',
        wards: '',
      });
      fetchOfficers();
    } catch (err) {
      alert('Failed to create officer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAutoAssign = async () => {
    if (!window.confirm('Auto-assign pending complaints to available officers?')) return;

    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/officers/bulk-assign`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      alert(`✅ Successfully assigned ${response.data.assignedCount} complaints`);
      fetchOfficers();
    } catch (err) {
      alert('Failed to auto-assign complaints');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Officer Management</h1>
        <div className="space-x-2">
          <button
            onClick={handleAutoAssign}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            disabled={loading}
          >
            🤖 Auto-Assign Complaints
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {showCreateForm ? 'Cancel' : '+ Add Officer'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Create New Officer</h2>
          <form onSubmit={handleCreateOfficer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="police">Police Officer</option>
                <option value="health_inspector">Health Inspector</option>
                <option value="traffic_officer">Traffic Officer</option>
                <option value="sanitation_officer">Sanitation Officer</option>
                <option value="water_manager">Water Manager</option>
                <option value="electricity_manager">Electricity Manager</option>
                <option value="parks_manager">Parks Manager</option>
              </select>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="roads">Roads</option>
                <option value="water">Water</option>
                <option value="electricity">Electricity</option>
                <option value="sanitation">Sanitation</option>
                <option value="parks">Parks</option>
                <option value="health">Health</option>
                <option value="general">General</option>
              </select>
              <input
                type="text"
                placeholder="Station/Office Location"
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Jurisdiction Wards (comma separated, e.g., W1,W2,W3)"
              value={formData.wards}
              onChange={(e) => setFormData({ ...formData, wards: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Bio (optional)"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Create Officer
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-3 gap-4">
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Departments</option>
            <option value="roads">Roads</option>
            <option value="water">Water</option>
            <option value="electricity">Electricity</option>
            <option value="sanitation">Sanitation</option>
            <option value="parks">Parks</option>
            <option value="health">Health</option>
            <option value="general">General</option>
          </select>
          <select
            value={filters.designation}
            onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Designations</option>
            <option value="police">Police Officer</option>
            <option value="health_inspector">Health Inspector</option>
            <option value="traffic_officer">Traffic Officer</option>
            <option value="sanitation_officer">Sanitation Officer</option>
            <option value="water_manager">Water Manager</option>
            <option value="electricity_manager">Electricity Manager</option>
            <option value="parks_manager">Parks Manager</option>
          </select>
          <select
            value={filters.isAvailable}
            onChange={(e) => setFilters({ ...filters, isAvailable: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="true">Available</option>
            <option value="false">Busy</option>
          </select>
        </div>
      </div>

      {/* Officers Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading officers...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : officers.length === 0 ? (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg text-center">
          No officers found. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officers.map((officer) => (
            <OfficerCard key={officer._id} officer={officer} />
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ About the Smart Routing System</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Complaints are automatically routed to available officers based on department & ward</li>
          <li>✓ The bot runs every 5 minutes to assign pending complaints</li>
          <li>✓ Officers are ranked by workload for balanced distribution</li>
          <li>✓ Overdue complaints are automatically escalated</li>
          <li>✓ Both officer and citizen receive email notifications</li>
        </ul>
      </div>
    </div>
  );
};

export default ManageOfficersPage;
