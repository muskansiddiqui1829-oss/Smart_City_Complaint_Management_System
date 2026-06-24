import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { MdLocationCity } from 'react-icons/md';
import { FiCheckCircle } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary-700 rounded-xl flex items-center justify-center">
              <MdLocationCity className="text-white text-2xl" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Smart City</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="card p-8 shadow-lg">
          {sent ? (
            <div className="text-center">
              <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Email Sent!</h3>
              <p className="text-gray-500 text-sm">Check your inbox for password reset instructions. The link expires in 30 minutes.</p>
              <Link to="/login" className="btn-primary mt-6 w-full btn-lg">Back to Sign In</Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-5 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-6">
                <Link to="/login" className="text-primary-700 font-medium hover:underline">← Back to Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
