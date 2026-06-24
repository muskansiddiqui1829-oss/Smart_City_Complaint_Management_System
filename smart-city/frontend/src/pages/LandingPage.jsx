import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiMapPin, FiTrendingUp, FiShield, FiClock } from 'react-icons/fi';
import { MdLocationCity } from 'react-icons/md';

const features = [
  { icon: FiMapPin, title: 'Location-Based Tracking', desc: 'Precisely report issues with ward and location details for faster resolution.' },
  { icon: FiTrendingUp, title: 'Real-Time Status Updates', desc: 'Track every complaint from submission to resolution with live email notifications.' },
  { icon: FiShield, title: 'Transparent Governance', desc: 'Full visibility into complaint handling with department accountability.' },
  { icon: FiClock, title: 'Faster Resolution', desc: 'Automated routing to correct departments ensures minimal response time.' },
];

const categories = [
  { label: 'Roads & Transport', color: 'bg-orange-100 text-orange-700', icon: '🛣️' },
  { label: 'Water Supply', color: 'bg-blue-100 text-blue-700', icon: '💧' },
  { label: 'Electricity', color: 'bg-yellow-100 text-yellow-700', icon: '⚡' },
  { label: 'Sanitation', color: 'bg-green-100 text-green-700', icon: '🗑️' },
  { label: 'Parks & Gardens', color: 'bg-emerald-100 text-emerald-700', icon: '🌳' },
  { label: 'Public Health', color: 'bg-red-100 text-red-700', icon: '🏥' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
              <MdLocationCity className="text-white text-xl" />
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight text-sm">Smart City</p>
              <p className="text-xs text-gray-500">Complaint Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary btn-sm hidden sm:flex">Sign In</Link>
            <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Platform serving 50,000+ citizens
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Your Voice,<br />
            <span className="text-blue-300">Your City</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Report civic issues, track resolution progress, and help build a better city — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn bg-white text-primary-800 hover:bg-gray-100 btn-lg font-bold">
              Report an Issue <FiArrowRight />
            </Link>
            <Link to="/login" className="btn border-2 border-white text-white hover:bg-white/10 btn-lg">
              Track Complaint
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto text-center">
            {[['12K+', 'Complaints\nResolved'], ['98%', 'Satisfaction\nRate'], ['2.3 Days', 'Avg Resolution\nTime']].map(([num, label]) => (
              <div key={num}>
                <p className="text-2xl font-bold text-white">{num}</p>
                <p className="text-xs text-blue-200 mt-1 whitespace-pre-line">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Report Any Civic Issue</h2>
          <p className="text-gray-500 text-center mb-10">From roads to public health — we cover every department</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(({ label, color, icon }) => (
              <Link key={label} to="/register" className={`${color} rounded-xl p-4 text-center hover:scale-105 transition-transform cursor-pointer`}>
                <span className="text-3xl block mb-2">{icon}</span>
                <p className="text-xs font-semibold leading-tight">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Why Choose Smart City?</h2>
          <p className="text-gray-500 text-center mb-12">Designed for transparency, built for efficiency</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="text-primary-700 text-xl" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4 sm:px-6 bg-primary-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">How It Works</h2>
          <p className="text-blue-200 mb-12">Simple 4-step process to get your issue resolved</p>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              ['1', 'Sign Up', 'Create your citizen account in under a minute'],
              ['2', 'Report', 'Submit your complaint with photos and location'],
              ['3', 'Track', 'Monitor progress with real-time status updates'],
              ['4', 'Resolved', 'Rate the resolution and provide feedback'],
            ].map(([step, title, desc]) => (
              <div key={step} className="relative">
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-blue-200 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Make a Difference?</h2>
          <p className="text-gray-500 mb-8">Join thousands of citizens who are already improving their neighborhoods</p>
          <Link to="/register" className="btn-primary btn-lg">
            Register for Free <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MdLocationCity className="text-primary-400 text-xl" />
          <span className="font-semibold text-white">Smart City Complaint Platform</span>
        </div>
        <p>© {new Date().getFullYear()} Smart City. All rights reserved.</p>
      </footer>
    </div>
  );
}
