import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = login(email, password);
      
      if (result.success) {
        const role = result.user.role;
        if (role === 'owner') {
          navigate('/dashboard');
        } else if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/renter');
        }
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Use <main> for the primary content area [cite: 52] */}
      <main className="register-split-container">
        
        {/* LEFT PANEL */}
        <div className="register-left-panel login-theme-panel">
          <div className="auth-logo-box">
            <svg
              width="55"
              height="55"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="auth-logo-svg"
              aria-hidden="true"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>

          {/* Correct Heading Levels [cite: 71, 73] */}
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue to CarRental</p>

          <div className="demo-accounts" style={{ marginTop: '30px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '15px', borderRadius: '8px' }}>
            <p className="demo-title" style={{ color: 'white', fontWeight: 'bold' }}>Quick Demo Access:</p>
            <p className="demo-account" style={{ color: '#e2e8f0' }}>Owner: owner@test.com</p>
            <p className="demo-account" style={{ color: '#e2e8f0' }}>Renter: renter@test.com</p>
            <p className="demo-account" style={{ color: '#e2e8f0' }}>Admin: admin@test.com</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="register-right-panel">
          <div className="login-form-wrapper">
            <h2 className="auth-title" style={{ textAlign: 'left', fontSize: '24px' }}>Sign In</h2>
            <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: '32px' }}>
              Enter your account details below
            </p>

            {error && <div className="error-message" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                {/* Step 2: Form Accessibility - Labels linked to IDs [cite: 61, 62] */}
                <label className="input-label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="input-label" htmlFor="login-password">Password</label>
                {/* Step 2: Improved Usability with functional Link */}
                <Link to="/forgot-password" style={{ fontSize: '12px', color: '#3F9B84', textDecoration: 'none', fontWeight: '500' }}>
                  Forgot Password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            
              {/* Step 3: Specify button type [cite: 65, 67] */}
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
                style={{ marginTop: '10px', height: '50px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <p className="auth-footer" style={{ textAlign: 'center', marginTop: '30px' }}>
              Don't have an account?{' '}
              <Link to="/register" className="link-bold" style={{ color: '#3F9B84' }}>Create Account</Link>
            </p>

            <p className="auth-footer" style={{ textAlign: 'center' }}>
              <Link to="/admin-register" className="link-admin">Admin Registration</Link>
            </p>
          </div>
        </div>
        
      </main>
    </div>
  );
}

export default Login;
