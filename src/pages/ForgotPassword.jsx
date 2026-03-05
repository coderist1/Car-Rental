import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call for password reset
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="auth-container">
      {/* Step 1: Use Semantic HTML <main> [cite: 49, 52] */}
      <main className="forgot-pw-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          {submitted 
            ? "Check your email for reset instructions." 
            : "Enter your email to receive a password reset link."}
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              {/* Step 2: Form Accessibility - Label linked to ID [cite: 60, 61, 62] */}
              <label className="input-label" htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                type="email"
                className="input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Step 3: Use Proper Button Type [cite: 67] */}
            <button 
              type="submit" 
              className="btn btn-primary btn-full" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="success-state">
            <p>If an account exists for {email}, you will receive an email shortly.</p>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/login" className="link-bold" style={{ color: '#3F9B84' }}>
            Back to Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;