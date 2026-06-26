import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const OfficerCard = ({ officer }) => {
  const statusColor = officer.isAvailable ? 'text-green-600' : 'text-red-600';
  const statusText = officer.isAvailable ? 'Available' : 'Busy';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">{officer.name}</h3>
          <p className="text-sm text-gray-600 capitalize">{officer.designation.replace(/_/g, ' ')}</p>
          <p className="text-sm text-gray-500">{officer.station}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor} bg-opacity-20`}>
          {statusText}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Assigned Complaints:</span>
          <span className="font-semibold text-blue-600">{officer.assignedCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Resolved:</span>
          <span className="font-semibold text-green-600">{officer.resolvedCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Rating:</span>
          <span className="font-semibold text-yellow-600">{officer.performanceRating.toFixed(2)}/5</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          📧 {officer.email}
        </p>
        <p className="text-xs text-gray-600">
          📞 {officer.phone}
        </p>
      </div>

      {officer.jurisdiction && officer.jurisdiction.wards && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-1">Jurisdiction:</p>
          <div className="flex flex-wrap gap-1">
            {officer.jurisdiction.wards.map((ward) => (
              <span key={ward} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                {ward}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerCard;
