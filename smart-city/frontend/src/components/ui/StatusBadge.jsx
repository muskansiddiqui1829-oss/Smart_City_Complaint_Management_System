const STATUS_CONFIG = {
  pending:      { label: 'Pending',      cls: 'bg-yellow-100 text-yellow-800' },
  under_review: { label: 'Under Review', cls: 'bg-blue-100 text-blue-800' },
  in_progress:  { label: 'In Progress',  cls: 'bg-purple-100 text-purple-800' },
  resolved:     { label: 'Resolved',     cls: 'bg-green-100 text-green-800' },
  rejected:     { label: 'Rejected',     cls: 'bg-red-100 text-red-800' },
  closed:       { label: 'Closed',       cls: 'bg-gray-100 text-gray-600' },
};

const PRIORITY_CONFIG = {
  low:      { label: 'Low',      cls: 'bg-gray-100 text-gray-600' },
  medium:   { label: 'Medium',   cls: 'bg-blue-100 text-blue-700' },
  high:     { label: 'High',     cls: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status, type = 'status', className = '' }) {
  const config = type === 'priority' ? PRIORITY_CONFIG : STATUS_CONFIG;
  const item = config[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`badge ${item.cls} ${className}`}>
      {item.label}
    </span>
  );
}
