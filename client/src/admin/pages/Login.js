import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaShieldAlt, FaChartLine, FaCog } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(credentials.username, credentials.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-split">
      {/* Left Side - Beach Background */}
      <div className="admin-login-left">
        <div className="admin-login-left-overlay"></div>
        <div className="admin-login-left-content">
          <div className="admin-login-brand-badge">
            <FaShieldAlt className="me-2" />
            ADMIN PORTAL
          </div>
          <div className="admin-login-brand-icon">🌊</div>
          <h1 className="admin-login-brand-name">AllenShores PH <span>ADMIN</span></h1>
          <p className="admin-login-brand-desc">
            Professional beach discovery, comparison, and booking management dashboard for Northern Samar's finest coastal destinations.
          </p>
          <div className="admin-login-stats">
            <div className="admin-login-stat">
              <FaChartLine className="stat-icon" />
              <span>Analytics & Reports</span>
            </div>
            <div className="admin-login-stat">
              <FaCog className="stat-icon" />
              <span>Full Management Control</span>
            </div>
          </div>
          <div className="admin-login-features">
            <div className="admin-login-feature">
              <span className="feature-dot"></span>
              <span>Manage beach listings & details</span>
            </div>
            <div className="admin-login-feature">
              <span className="feature-dot"></span>
              <span>Review bookings & reservations</span>
            </div>
            <div className="admin-login-feature">
              <span className="feature-dot"></span>
              <span>Monitor visitor reviews & ratings</span>
            </div>
          </div>
        </div>
        <div className="admin-login-left-footer">
          © {new Date().getFullYear()} AllenShores PH Admin. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="admin-login-right">
        <div className="admin-login-form-container">
          <div className="admin-login-form-header text-center">
            <div className="admin-login-form-icon">
              <FaShieldAlt />
            </div>
            <h2 className="admin-login-form-title">Admin Login</h2>
            <p className="admin-login-form-subtitle">Sign in to access the admin dashboard</p>
          </div>

          {error && (
            <Alert variant="danger" className="admin-login-alert">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="admin-form-group">
              <Form.Label className="admin-form-label">
                <FaUser className="me-2" />
                Admin Username
              </Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder="Enter admin username"
                required
                autoFocus
                className="admin-form-control"
              />
            </Form.Group>

            <Form.Group className="admin-form-group">
              <Form.Label className="admin-form-label">
                <FaLock className="me-2" />
                Admin Password
              </Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Enter admin password"
                  required
                  className="admin-form-control password-control"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePassword}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Form.Group>

            <Button 
              type="submit" 
              className="admin-login-btn w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <FaSignInAlt className="me-2" />
                  Sign In to Admin
                </>
              )}
            </Button>
          </Form>

        </div>
      </div>
    </div>
  );
};

export default Login;
