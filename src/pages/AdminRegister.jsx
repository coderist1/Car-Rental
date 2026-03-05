import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Auth.css';

function AdminRegister() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminKey: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { level: 0, text: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { level: strength, text: levels[strength] };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await registerAdmin(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        },
        formData.adminKey
      );

      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <main className="register-split-container">
        
        {/* LEFT PANEL - Admin Branding & Security Info */}
        <div className="register-left-panel">
          <div className="auth-logo-box">
            <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="auth-logo-svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>

          <h2 className="auth-title">Admin Access</h2>
          <p className="auth-subtitle">Elevated permissions registration</p>

          <div className="role-section" style={{ marginTop: '30px' }}>
            <div className="info-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '14px', color: '#1e293b', marginBottom: '8px' }}>Security Protocol</h4>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                Admin accounts require a unique <strong>Admin Key</strong> provided by the system owner. This ensures only authorized personnel can access the management dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - The Form */}
        <div className="register-right-panel">
          {error && <div className="error-message" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="section-label">Administrator Details</div>

            <div className="register-form-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="firstName">First Name <span className="required">*</span></label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  className="input"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="lastName">Last Name <span className="required">*</span></label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  className="input"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group span-full">
                <label className="input-label" htmlFor="email">Work Email <span className="required">*</span></label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="input"
                  placeholder="admin@carrental.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group span-full">
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '10px', marginBottom: '4px' }}>
                  Password must include uppercase, lowercase, numbers, and symbols.
                </p>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="reg-password">Password <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                
                {formData.password && (
                  <div className="password-strength" style={{ marginTop: '8px' }}>
                    <div className="strength-meter" style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        className={`strength-bar level-${strength.level}`}
                        style={{ 
                          width: `${strength.level * 20}%`, 
                          height: '100%', 
                          transition: 'width 0.3s ease',
                          background: strength.level < 3 ? '#ef4444' : strength.level < 5 ? '#f59e0b' : '#3F9B84'
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="confirmPassword">Confirm <span className="required">*</span></label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  className="input"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group span-full" style={{ marginTop: '10px' }}>
                <label className="input-label" htmlFor="adminKey">Admin Authorization Key <span className="required">*</span></label>
                <input
                  id="adminKey"
                  type="password"
                  name="adminKey"
                  className="input"
                  placeholder="Enter secure key"
                  value={formData.adminKey}
                  onChange={handleChange}
                  style={{ border: '1px solid #94a3b8' }}
                  required
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '11px' }}>
                  Default key: <strong>ADMIN2026</strong>
                </small>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              style={{ marginTop: '24px', background: '#1e293b' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Register Administrator'}
            </button>
          </form>

          <p className="auth-footer" style={{ marginTop: '24px' }}>
            Not an admin?{' '}
            <Link to="/register" className="link-bold">User Registration</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default AdminRegister;
