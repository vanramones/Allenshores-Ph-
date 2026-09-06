import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaShieldAlt, FaChartLine, FaCog, FaUmbrellaBeach, FaHome } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, ownerLogin, staffLogin } = useAuth();

  // Super Admin login state
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Owner login state
  const [loginMode, setLoginMode] = useState('admin'); // 'admin' or 'owner'
  const [selectedBeach, setSelectedBeach] = useState(null); // 'sunrise', 'cabavilla', 'tonying'
  const [ownerCreds, setOwnerCreds] = useState({ username: '', password: '' });
  const [ownerError, setOwnerError] = useState('');
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  const beachOptions = [
    { key: 'sunrise', label: 'Sunrise Beach Resort', username: 'sunrise', icon: '🌅' },
    { key: 'cabavilla', label: 'Caba Villa Diaz Beach', username: 'cabavilla', icon: '🏖️' },
    { key: 'tonying', label: 'Tonying Beach', username: 'tonying', icon: '🌴' }
  ];

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

  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    setOwnerError('');
    setOwnerLoading(true);

    try {
      const beach = beachOptions.find(b => b.key === selectedBeach);
      const username = ownerCreds.username || beach?.username || '';
      
      // Try owner login first, then staff login
      try {
        await ownerLogin(username, ownerCreds.password);
      } catch (ownerErr) {
        // If owner login fails, try staff login
        try {
          await staffLogin(username, ownerCreds.password);
        } catch (staffErr) {
          throw ownerErr; // Show owner error
        }
      }
      navigate('/owner/dashboard');
    } catch (err) {
      setOwnerError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleBeachSelect = (beachKey) => {
    setSelectedBeach(beachKey);
    const beach = beachOptions.find(b => b.key === beachKey);
    setOwnerCreds({ username: beach?.username || '', password: '' });
    setOwnerError('');
  };

  return (
    <div className="admin-login-split">
      {/* Left Side - Beach Background */}
      <div className="admin-login-left">
        <div className="admin-login-left-overlay"></div>
        <div className="admin-login-left-content">
          <div className="admin-login-brand-badge">
            <FaShieldAlt className="me-2" />
            {loginMode === 'admin' ? 'ADMIN PORTAL' : 'BEACH OWNER PORTAL'}
          </div>
          <div className="admin-login-brand-icon">🌊</div>
          <h1 className="admin-login-brand-name">AllenShores PH <span>{loginMode === 'admin' ? 'ADMIN' : 'OWNER'}</span></h1>
          <p className="admin-login-brand-desc">
            {loginMode === 'admin'
              ? "Professional beach discovery, comparison, and booking management dashboard for Northern Samar's finest coastal destinations."
              : "Manage your beach bookings, reviews, and monitor your beach performance with a dedicated owner dashboard."}
          </p>
          <div className="admin-login-stats">
            <div className="admin-login-stat">
              <FaChartLine className="stat-icon" />
              <span>{loginMode === 'admin' ? 'Analytics & Reports' : 'Booking Management'}</span>
            </div>
            <div className="admin-login-stat">
              <FaCog className="stat-icon" />
              <span>{loginMode === 'admin' ? 'Full Management Control' : 'Review Monitoring'}</span>
            </div>
          </div>
          <div className="admin-login-features">
            <div className="admin-login-feature">
              <span className="feature-dot"></span>
              <span>{loginMode === 'admin' ? 'Manage all beach listings & details' : 'View and manage your beach bookings'}</span>
            </div>
            <div className="admin-login-feature">
              <span className="feature-dot"></span>
              <span>{loginMode === 'admin' ? 'Review bookings & reservations' : 'Monitor visitor reviews & ratings'}</span>
            </div>
            <div className="admin-login-feature">
              <span className="feature-dot"></span>
              <span>{loginMode === 'admin' ? 'Monitor visitor reviews & ratings' : 'Track your beach performance'}</span>
            </div>
          </div>
        </div>
        <div className="admin-login-left-footer">
          © {new Date().getFullYear()} AllenShores PH {loginMode === 'admin' ? 'Super Admin' : 'Owner'}. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="admin-login-right">
        <div className="admin-login-form-container">
          <div className="admin-login-form-header text-center">
            <div className="admin-login-form-icon">
              {loginMode === 'admin' ? <FaShieldAlt /> : <FaUmbrellaBeach />}
            </div>
            <h2 className="admin-login-form-title">
              {loginMode === 'admin' ? 'Super Admin Login' : 'Beach Owner Login'}
            </h2>
            <p className="admin-login-form-subtitle">
              {loginMode === 'admin'
                ? 'Sign in to access the admin dashboard'
                : 'Sign in to manage your beach'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="login-mode-toggle mb-4">
            <button
              type="button"
              className={`login-mode-btn ${loginMode === 'admin' ? 'active' : ''}`}
              onClick={() => { setLoginMode('admin'); setError(''); setOwnerError(''); }}
            >
              <FaShieldAlt className="me-2" />
              Super Admin
            </button>
            <button
              type="button"
              className={`login-mode-btn ${loginMode === 'owner' ? 'active' : ''}`}
              onClick={() => { setLoginMode('owner'); setError(''); setOwnerError(''); setSelectedBeach(null); }}
            >
              <FaUmbrellaBeach className="me-2" />
              Beach Owner
            </button>
          </div>

          {/* Super Admin Login Form */}
          {loginMode === 'admin' && (
            <>
              {error && (
                <Alert variant="danger" className="admin-login-alert">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="admin-form-group">
                  <Form.Label className="admin-form-label">
                    <FaUser className="me-2" />
                    Super Admin Username
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
                    Super Admin Password
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
                      Sign In to Super Admin
                    </>
                  )}
                </Button>
              </Form>
            </>
          )}

          {/* Beach Owner Login Form */}
          {loginMode === 'owner' && (
            <>
              {!selectedBeach ? (
                /* Beach Selection */
                <div className="owner-beach-selection">
                  <p className="text-muted text-center mb-3" style={{ fontSize: '0.95rem' }}>
                    Select your beach to continue
                  </p>
                  <div className="owner-beach-options">
                    {beachOptions.map(beach => (
                      <button
                        key={beach.key}
                        type="button"
                        className="owner-beach-option-card"
                        onClick={() => handleBeachSelect(beach.key)}
                      >
                        <span className="owner-beach-option-icon">{beach.icon}</span>
                        <span className="owner-beach-option-label">{beach.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Owner Login Form */
                <>
                  <div className="owner-selected-beach mb-3">
                    <FaHome className="me-2" />
                    <span>{beachOptions.find(b => b.key === selectedBeach)?.label}</span>
                    <button
                      type="button"
                      className="owner-change-beach-btn"
                      onClick={() => { setSelectedBeach(null); setOwnerCreds({ username: '', password: '' }); setOwnerError(''); }}
                    >
                      Change
                    </button>
                  </div>

                  {ownerError && (
                    <Alert variant="danger" className="admin-login-alert">
                      {ownerError}
                    </Alert>
                  )}

                  <Form onSubmit={handleOwnerSubmit}>
                    <Form.Group className="admin-form-group">
                      <Form.Label className="admin-form-label">
                        <FaUser className="me-2" />
                        Username (Owner or Staff)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={ownerCreds.username}
                        onChange={(e) => setOwnerCreds({ ...ownerCreds, username: e.target.value })}
                        placeholder="Enter username"
                        required
                        autoFocus
                        className="admin-form-control"
                      />
                    </Form.Group>

                    <Form.Group className="admin-form-group">
                      <Form.Label className="admin-form-label">
                        <FaLock className="me-2" />
                        Password
                      </Form.Label>
                      <div className="password-input-wrapper">
                        <Form.Control
                          type={showOwnerPassword ? 'text' : 'password'}
                          name="password"
                          value={ownerCreds.password}
                          onChange={(e) => setOwnerCreds({ ...ownerCreds, password: e.target.value })}
                          placeholder="Enter owner password"
                          required
                          className="admin-form-control password-control"
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                          tabIndex={-1}
                        >
                          {showOwnerPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </Form.Group>

                    <Button
                      type="submit"
                      className="admin-login-btn w-100"
                      disabled={ownerLoading}
                    >
                      {ownerLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <FaSignInAlt className="me-2" />
                          Sign In to Owner Dashboard
                        </>
                      )}
                    </Button>
                  </Form>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
