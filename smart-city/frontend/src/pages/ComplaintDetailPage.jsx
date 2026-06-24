import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { complaintAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/ui/StatusBadge';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiMapPin, FiCalendar, FiUser, FiThumbsUp, FiEye,
  FiArrowLeft, FiStar, FiTag, FiClock, FiCheckCircle,
} from 'react-icons/fi';

const STATUS_STEPS = ['pending', 'under_review', 'in_progress', 'resolved'];

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { user, isAdmin, isDepartmentHead } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', comment: '', resolutionDetails: '' });
  const [updating, setUpdating] = useState(false);
  const [ratingForm, setRatingForm] = useState({ score: 0, feedback: '' });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const res = await complaintAPI.getById(id);
      setComplaint(res.data);
      setStatusForm(prev => ({ ...prev, status: res.data.status }));
    } catch (err) {
      toast.error('Complaint not found');
      navigate('/complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (upvoting) return;
    setUpvoting(true);
    try {
      const res = await complaintAPI.upvote(id);
      setComplaint(prev => ({
        ...prev,
        upvotes: res.upvoted
          ? [...(prev.upvotes || []), user.id]
          : (prev.upvotes || []).filter(uid => uid !== user.id),
        upvoteCount: res.upvoteCount,
      }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpvoting(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusForm.status) return;
    setUpdating(true);
    try {
      const res = await complaintAPI.updateStatus(id, statusForm);
      setComplaint(res.data);
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRating = async (e) => {
    e.preventDefault();
    if (!ratingForm.score) { toast.error('Please select a rating'); return; }
    setSubmittingRating(true);
    try {
      await complaintAPI.rate(id, ratingForm);
      toast.success('Thank you for your feedback!');
      fetchComplaint();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await complaintAPI.delete(id);
      toast.success('Complaint deleted');
      navigate('/complaints');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="card p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  const isOwner = complaint.citizen?._id === user?.id || complaint.citizen?._id?.toString() === user?.id;
  const hasUpvoted = complaint.upvotes?.some(uid => uid === user?.id || uid?.toString() === user?.id);
  const currentStepIndex = STATUS_STEPS.indexOf(complaint.status);
  const isRejected = complaint.status === 'rejected';

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary btn-sm mt-1 shrink-0">
          <FiArrowLeft />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={complaint.status} />
            <StatusBadge status={complaint.priority} type="priority" />
            <span className="text-xs text-gray-400 font-mono">{complaint.complaintId}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{complaint.title}</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status Progress */}
          {!isRejected && complaint.status !== 'closed' && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Resolution Progress</h3>
              <div className="flex items-center">
                {STATUS_STEPS.map((s, idx) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className={`flex flex-col items-center`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${idx <= currentStepIndex ? 'bg-primary-700 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {idx < currentStepIndex ? <FiCheckCircle className="text-sm" /> : idx + 1}
                      </div>
                      <span className="text-xs text-gray-500 mt-1 text-center hidden sm:block capitalize">
                        {s.replace('_', ' ')}
                      </span>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 sm:mb-5 transition-all
                        ${idx < currentStepIndex ? 'bg-primary-700' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>

            {complaint.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                <FiTag className="text-gray-400 mt-0.5" />
                {complaint.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          {complaint.images?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Photos ({complaint.images.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.images.map((img, idx) => (
                  <img key={idx} src={img.url} alt={`Complaint photo ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-100"
                    onClick={() => setSelectedImage(img.url)} />
                ))}
              </div>
            </div>
          )}

          {/* Resolution Details */}
          {complaint.resolutionDetails && (
            <div className="card p-6 border-l-4 border-green-500">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <FiCheckCircle /> Resolution Details
              </h3>
              <p className="text-gray-600 text-sm">{complaint.resolutionDetails}</p>
              {complaint.resolvedAt && (
                <p className="text-xs text-gray-400 mt-2">Resolved on {format(new Date(complaint.resolvedAt), 'MMM d, yyyy')}</p>
              )}
            </div>
          )}

          {/* Admin Notes */}
          {complaint.adminNotes && (isAdmin || isDepartmentHead) && (
            <div className="card p-6 border-l-4 border-blue-400">
              <h3 className="font-semibold text-blue-800 mb-2">Admin Notes (Internal)</h3>
              <p className="text-gray-600 text-sm">{complaint.adminNotes}</p>
            </div>
          )}

          {/* Status History */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {[...(complaint.statusHistory || [])].reverse().map((entry, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0
                      ${entry.status === 'resolved' ? 'bg-green-500' :
                        entry.status === 'rejected' ? 'bg-red-500' :
                        entry.status === 'in_progress' ? 'bg-purple-500' : 'bg-blue-400'}`} />
                    {idx < (complaint.statusHistory?.length || 0) - 1 && (
                      <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={entry.status} />
                      <span className="text-xs text-gray-400">
                        {format(new Date(entry.timestamp), 'MMM d, yyyy · h:mm a')}
                      </span>
                      {entry.updatedBy?.name && (
                        <span className="text-xs text-gray-400">by {entry.updatedBy.name}</span>
                      )}
                    </div>
                    {entry.comment && (
                      <p className="text-sm text-gray-600 mt-1">{entry.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Section (for resolved complaints) */}
          {complaint.status === 'resolved' && isOwner && !complaint.rating?.score && (
            <div className="card p-6 border-2 border-yellow-200 bg-yellow-50">
              <h3 className="font-semibold text-gray-800 mb-4">Rate this Resolution</h3>
              <form onSubmit={handleRating} className="space-y-4">
                <div>
                  <label className="label">Your Rating *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} type="button"
                        onClick={() => setRatingForm(prev => ({ ...prev, score: s }))}
                        className={`text-2xl transition-transform hover:scale-110
                          ${ratingForm.score >= s ? 'text-yellow-400' : 'text-gray-300'}`}>
                        <FiStar className={ratingForm.score >= s ? 'fill-current' : ''} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Feedback (optional)</label>
                  <textarea
                    value={ratingForm.feedback}
                    onChange={e => setRatingForm(prev => ({ ...prev, feedback: e.target.value }))}
                    rows={3} className="input resize-none"
                    placeholder="How was the resolution of your complaint?" />
                </div>
                <button type="submit" disabled={submittingRating} className="btn-primary">
                  {submittingRating ? <span className="spinner" /> : null}
                  Submit Rating
                </button>
              </form>
            </div>
          )}

          {/* Display submitted rating */}
          {complaint.rating?.score && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Citizen Rating</h3>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <FiStar key={s}
                    className={`text-xl ${complaint.rating.score >= s ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
                <span className="text-sm text-gray-600 ml-2">{complaint.rating.score}/5</span>
              </div>
              {complaint.rating.feedback && (
                <p className="text-sm text-gray-600 italic">"{complaint.rating.feedback}"</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Meta */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Complaint Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2 text-gray-600">
                <FiMapPin className="mt-0.5 text-primary-500 shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">{complaint.location?.address}</p>
                  {complaint.location?.ward && <p className="text-xs text-gray-400">{complaint.location.ward}</p>}
                  {complaint.location?.city && <p className="text-xs text-gray-400">{complaint.location.city}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FiCalendar className="text-primary-500 shrink-0" />
                <span>{format(new Date(complaint.createdAt), 'MMM d, yyyy')}</span>
              </div>
              {!complaint.isAnonymous && complaint.citizen?.name && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiUser className="text-primary-500 shrink-0" />
                  <span>{complaint.citizen.name}</span>
                </div>
              )}
              {complaint.assignedTo && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiUser className="text-orange-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Assigned to</p>
                    <p className="font-medium text-gray-700">{complaint.assignedTo.name}</p>
                  </div>
                </div>
              )}
              {complaint.expectedResolutionDate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiClock className="text-orange-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Expected by</p>
                    <p className="font-medium">{format(new Date(complaint.expectedResolutionDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-gray-500">
                <span className="flex items-center gap-1"><FiThumbsUp className="text-xs" /> {complaint.upvoteCount || 0}</span>
                <span className="flex items-center gap-1"><FiEye className="text-xs" /> {complaint.views || 0}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-3">
            {user?.role === 'citizen' && (
              <button onClick={handleUpvote} disabled={upvoting}
                className={`w-full btn ${hasUpvoted ? 'btn-primary' : 'btn-secondary'}`}>
                <FiThumbsUp /> {hasUpvoted ? 'Upvoted' : 'Upvote'} ({complaint.upvoteCount || 0})
              </button>
            )}
            {isOwner && complaint.status === 'pending' && (
              <button onClick={handleDelete} className="btn-danger w-full btn-sm">
                Delete Complaint
              </button>
            )}
          </div>

          {/* Admin Status Update */}
          {(isAdmin || isDepartmentHead) && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm">Update Status</h3>
              <form onSubmit={handleStatusUpdate} className="space-y-3">
                <div>
                  <label className="label text-xs">New Status</label>
                  <select value={statusForm.status}
                    onChange={e => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                    className="input text-sm">
                    {['pending','under_review','in_progress','resolved','rejected','closed'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Comment</label>
                  <textarea value={statusForm.comment}
                    onChange={e => setStatusForm(prev => ({ ...prev, comment: e.target.value }))}
                    rows={2} className="input resize-none text-sm"
                    placeholder="Update message for citizen..." />
                </div>
                {statusForm.status === 'resolved' && (
                  <div>
                    <label className="label text-xs">Resolution Details</label>
                    <textarea value={statusForm.resolutionDetails}
                      onChange={e => setStatusForm(prev => ({ ...prev, resolutionDetails: e.target.value }))}
                      rows={2} className="input resize-none text-sm"
                      placeholder="How was this resolved?" />
                  </div>
                )}
                <button type="submit" disabled={updating} className="btn-primary w-full btn-sm">
                  {updating ? <span className="spinner" /> : null}
                  Update Status
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Enlarged" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={() => setSelectedImage(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
