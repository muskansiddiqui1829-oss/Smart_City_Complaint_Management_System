import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { FiBell, FiCheckCircle, FiTrash2, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  complaint_submitted: '📋',
  status_updated: '🔄',
  complaint_assigned: '👤',
  complaint_resolved: '✅',
  complaint_rejected: '❌',
  comment_added: '💬',
  rating_requested: '⭐',
  system: '🔔',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async (p = 1) => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll({ page: p, limit: 15 });
      setNotifications(p === 1 ? res.data : prev => [...prev, ...res.data]);
      setUnreadCount(res.unreadCount);
      setTotalPages(Math.ceil(res.total / 15));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(1); }, []);

  const markAllRead = async () => {
    try {
      await notificationAPI.markRead([]);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const markOneRead = async (id) => {
    try {
      await notificationAPI.markRead([id]);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary btn-sm">
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <FiBell className="text-5xl text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No notifications yet</h3>
          <p className="text-gray-400 text-sm">You'll be notified about updates to your complaints here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n._id}
              className={`card p-4 flex items-start gap-3 transition-all hover:shadow-sm
                ${!n.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0
                ${!n.isRead ? 'bg-primary-100' : 'bg-gray-100'}`}>
                {TYPE_ICONS[n.type] || '🔔'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {n.title}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0">
                    {format(new Date(n.createdAt), 'MMM d')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                {n.complaint && (
                  <Link to={`/complaints/${n.complaint._id}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary-600 hover:underline">
                    View complaint {n.complaint.complaintId} →
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <button onClick={() => markOneRead(n._id)}
                    title="Mark as read"
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    <FiCheckCircle className="text-base" />
                  </button>
                )}
                <button onClick={() => deleteNotification(n._id)}
                  title="Delete"
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <FiTrash2 className="text-base" />
                </button>
              </div>
            </div>
          ))}

          {page < totalPages && (
            <div className="text-center pt-4">
              <button onClick={loadMore} disabled={loading} className="btn-secondary">
                {loading ? <span className="spinner" /> : null}
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
