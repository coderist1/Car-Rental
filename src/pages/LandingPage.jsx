import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/LandingPage.css';

/**
 * LandingPage Component
 * Main entry point for the Car Rental application
 * Provides navigation to Login, Register, and Admin Login pages
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect authenticated users to their appropriate dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'owner') {
        navigate('/dashboard', { replace: true });
      } else if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user?.role === 'renter') {
        navigate('/renter', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  /**
   * Handle navigation to different routes
   * @param {string} path - The route path to navigate to
   */
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="landing-page-container">
      {/* Decorative background shapes */}
      <div className="decoration shape-1"></div>
      <div className="decoration shape-2"></div>

      <main className="auth-card">
        {/* Brand Identity Section */}
        <div className="brand-identity">
          <div className="logo-box">
            <svg
              width="55"
              height="55"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <div className="logo-text">
            Car<span>Rental</span>
          </div>
        </div>

        {/* Page Title and Description */}
        <h1>Welcome</h1>
        <p className="subtitle">Find your perfect ride for your next big adventure.</p>

        {/* Action Buttons */}
        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={() => handleNavigation('/login')}
          >
            Login
          </button>

          <button
            className="btn btn-outline"
            onClick={() => handleNavigation('/register')}
          >
            Create Account
          </button>

          <button
            className="btn btn-admin"
            onClick={() => handleNavigation('/admin-register')}
          >
            Admin Login
          </button>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
