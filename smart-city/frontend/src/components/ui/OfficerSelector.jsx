import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OfficerSelector = ({ onSelectOfficer, department, ward, selectedOfficerId }) => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOfficers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (department) params.department = department;
        if (ward) params.ward = ward;

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/officers`, {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setOfficers(response.data.data || []);
      } catch (err) {
        setError('Failed to load officers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (department) {
      fetchOfficers();
    }
  }, [department, ward]);

  if (loading) {
    return <div className="text-center py-4">Loading officers...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-sm">{error}</div>;
  }

  if (officers.length === 0) {
    return <div className="text-gray-500 text-sm">No officers available for this department</div>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Select Officer</label>
      <select
        value={selectedOfficerId || ''}
        onChange={(e) => {
          const selected = officers.find((o) => o._id === e.target.value);
          onSelectOfficer(selected);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">-- Select an Officer --</option>
        {officers.map((officer) => (
          <option key={officer._id} value={officer._id}>
            {officer.name} - {officer.designation.replace(/_/g, ' ')} ({officer.assignedCount} complaints)
          </option>
        ))}
      </select>

      {selectedOfficerId && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          {officers.map((officer) => {
            if (officer._id === selectedOfficerId) {
              return (
                <div key={officer._id}>
                  <p className="font-semibold text-gray-800">{officer.name}</p>
                  <p className="text-sm text-gray-600">{officer.station}</p>
                  <p className="text-sm text-gray-600">📧 {officer.email}</p>
                  <p className="text-sm text-gray-600">📞 {officer.phone}</p>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default OfficerSelector;
