import React, { useState } from 'react';
import axios from 'axios';
import OfficerSelector from './OfficerSelector';

const AssignOfficerPanel = ({ complaint, onAssignmentSuccess }) => {
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAssign = async () => {
    if (!selectedOfficer) {
      setError('Please select an officer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/officers/${selectedOfficer._id}/assign-complaint`,
        {
          complaintId: complaint._id,
          notes,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setShowAssignForm(false);
      setSelectedOfficer(null);
      setNotes('');
      onAssignmentSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign officer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">🚔 Field Officer Assignment</h3>

      {complaint.assignedOfficer ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2">Currently Assigned To:</p>
          <div className="space-y-1">
            <p className="font-semibold text-green-700">
              {complaint.assignedOfficer?.name || 'Loading...'}
            </p>
            <p className="text-sm text-gray-700">
              {complaint.assignedOfficer?.designation?.replace(/_/g, ' ') || ''}
            </p>
            <p className="text-sm text-gray-600">
              📧 {complaint.assignedOfficer?.email}
            </p>
            <p className="text-sm text-gray-600">
              📍 {complaint.assignedOfficer?.station}
            </p>
            {complaint.officerAssignedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Assigned on: {new Date(complaint.officerAssignedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            ⚠️ No officer assigned yet. This complaint will be auto-assigned by the system.
          </p>
        </div>
      )}

      {!showAssignForm ? (
        <button
          onClick={() => setShowAssignForm(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {complaint.assignedOfficer ? '✏️ Reassign Officer' : '+ Assign Officer'}
        </button>
      ) : (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          <OfficerSelector
            onSelectOfficer={setSelectedOfficer}
            department={complaint.department}
            ward={complaint.location.ward}
            selectedOfficerId={selectedOfficer?._id}
          />

          <textarea
            placeholder="Notes for officer (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleAssign}
              disabled={loading || !selectedOfficer}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
            <button
              onClick={() => {
                setShowAssignForm(false);
                setSelectedOfficer(null);
                setNotes('');
                setError(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignOfficerPanel;
