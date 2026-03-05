import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/pages/Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    sex: '',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'owner'
  });
  
  // States for enhanced UX
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  // Logic for Strength Meter (Mirrored from ChangePassword)
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

    // Enhanced Validation
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
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        sex: formData.sex,
        dateOfBirth: formData.dateOfBirth,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (result.success) {
        navigate(formData.role === 'owner' ? '/dashboard' : '/renter');
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
        
        {/* LEFT PANEL - Branding & Role Selection */}
        <div className="register-left-panel">
          <div className="auth-logo-box">
            <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="auth-logo-svg">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>

          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join CarRental today</p>

          <div className="role-section" style={{ marginTop: '20px' }}>
            <label className="role-label">I want to:</label>
            <div className="role-container register-role-stack">
              <button 
                type="button"
                className={`role-button ${formData.role === 'owner' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('owner')}
              >
                <div className="role-icon">🚗</div>
                <div className="role-text">List My Car</div>
                <div className="role-description">Rent out your vehicle and earn</div>
              </button>
              <button 
                type="button"
                className={`role-button ${formData.role === 'renter' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('renter')}
              >
                <div className="role-icon">🙋</div>
                <div className="role-text">Rent a Car</div>
                <div className="role-description">Browse and rent available vehicles</div>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - The Form */}
        <div className="register-right-panel">
          {error && <div className="error-message" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="section-label">Personal Information</div>

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

              <div className="input-group">
                <label className="input-label" htmlFor="middleName">Middle Name</label>
                <input
                  id="middleName"
                  type="text"
                  name="middleName"
                  className="input"
                  placeholder="Optional"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="sex">Sex <span className="required">*</span></label>
                <select
                  id="sex"
                  name="sex"
                  className="input select-input"
                  value={formData.sex}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not">Prefer not to say</option>
                </select>
              </div>

              <div className="input-group span-full">
                <label className="input-label" htmlFor="dob">Date of Birth <span className="required">*</span></label>
                <input
                  id="dob"
                  type="date"
                  name="dateOfBirth"
                  className="input"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="section-label" style={{ marginTop: '10px' }}>Account Information</div>

            <div className="register-form-grid">
              <div className="input-group span-full">
                <label className="input-label" htmlFor="email">Email <span className="required">*</span></label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="input"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>


              {/* Password Group */}
              <div className="input-group span-full">
                <p style={{ fontSize: '11px',textAlign: 'left', color: '#64748b', marginTop: '7px', marginBottom: '1px', lineHeight: '1.0' }}>
                  Password must be at least 8 characters, including uppercase, lowercase, numbers, and symbols.
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
                    placeholder="Min. 8 characters"
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
                    <p style={{ fontSize: '11px', marginTop: '4px', color: '#64748b' }}>Strength: {strength.text}</p>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  className="input"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              style={{ marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer" style={{ marginTop: '24px' }}>
            Already have an account?{' '}
            <Link to="/login" className="link-bold">Sign In</Link>
          </p>

          <p className="auth-footer">
            <Link to="/admin-register" className="link-admin">Register as Admin</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;
