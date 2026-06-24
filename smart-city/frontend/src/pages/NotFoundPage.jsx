import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-primary-100 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary btn-lg">
          <FiHome /> Back to Home
        </Link>
      </div>
    </div>
  );
}
