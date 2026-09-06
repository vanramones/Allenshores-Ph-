import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Nav, Button, Dropdown, Badge } from 'react-bootstrap';
import {
  FaTachometerAlt, FaCalendarCheck, FaStar, FaFileAlt, FaEdit,
  FaSignOutAlt, FaBars, FaTimes, FaExternalLinkAlt, FaUmbrellaBeach, FaBell
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { ownerAPI } from '../../services/api';

// Color themes for each beach owner
const ownerThemes = {
  // Sunrise Beach - Teal/Green
  2: {
    name: 'sunrise',
    primary: '#0f766e',
    primaryDark: '#134e4a',
    primaryLight: '#14b8a6',
    gradient: 'linear-gradient(180deg, #0f766e 0%, #134e4a 100%)',
    welcomeGradient: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
    shadow: 'rgba(15, 118, 110, 0.3)',
    accent: '#d1fae5'
  },
  // Caba Villa Diaz - Orange/Sunset
  7: {
    name: 'cabavilla',
    primary: '#ea580c',
    primaryDark: '#9a3412',
    primaryLight: '#fb923c',
    gradient: 'linear-gradient(180deg, #ea580c 0%, #9a3412 100%)',
    welcomeGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    shadow: 'rgba(234, 88, 12, 0.3)',
    accent: '#ffedd5'
  },
  // Tonying Beach - Blue/Ocean
  11: {
    name: 'tonying',
    primary: '#0369a1',
    primaryDark: '#0c4a6e',
    primaryLight: '#0ea5e9',
    gradient: 'linear-gradient(180deg, #0369a1 0%, #0c4a6e 100%)',
    welcomeGradient: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
    shadow: 'rgba(3, 105, 161, 0.3)',
    accent: '#e0f2fe'
  }
};

// Default theme (teal)
const defaultTheme = ownerThemes[2];

const OwnerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { owner, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch pending bookings count for notification bell
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await ownerAPI.getBookings({ status: 'pending' });
        setPendingCount(response.data.length);
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };
    fetchPendingCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/owner/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/owner/beach', icon: <FaEdit />, label: 'My Beach' },
    { path: '/owner/bookings', icon: <FaCalendarCheck />, label: 'Bookings' },
    { path: '/owner/reviews', icon: <FaStar />, label: 'Reviews' },
    { path: '/owner/reports', icon: <FaFileAlt />, label: 'Reports' }
  ];

  const getPageTitle = () => {
    return navItems.find(item => item.path === location.pathname)?.label || 'Owner';
  };

  // Get theme based on owner's beach_id
  const theme = ownerThemes[owner?.beach_id] || defaultTheme;

  return (
    <div className={`admin-layout d-flex owner-theme-${theme.name}`} data-theme={theme.name}>
      {/* Mobile Overlay */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - Desktop */}
      <aside className="admin-sidebar d-none d-lg-flex" style={{ background: theme.gradient }}>
        <SidebarContent
          navItems={navItems}
          location={location}
          onLogout={handleLogout}
          owner={owner}
          pendingCount={pendingCount}
          theme={theme}
        />
      </aside>

      {/* Sidebar - Mobile */}
      <aside className={`admin-sidebar admin-sidebar-mobile d-lg-none ${sidebarOpen ? 'open' : ''}`} style={{ background: theme.gradient }}>
        <SidebarContent
          navItems={navItems}
          location={location}
          onLogout={handleLogout}
          owner={owner}
          onClose={() => setSidebarOpen(false)}
          pendingCount={pendingCount}
          theme={theme}
        />
      </aside>

      {/* Main Content */}
      <main className="admin-main flex-grow-1">
        {/* Top Navbar */}
        <header className="admin-topbar sticky-top">
          <div className="admin-topbar-left">
            <Button
              variant="light"
              className="admin-mobile-toggle d-lg-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </Button>
            <div className="admin-page-info">
              <h5 className="admin-page-title">{getPageTitle()}</h5>
              <p className="admin-page-breadcrumb">
                Beach Owner / {getPageTitle()}
              </p>
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* Notification Bell */}
            <Button
              variant="light"
              className="admin-notification-btn position-relative me-2"
              onClick={() => navigate('/owner/bookings')}
              title="Pending Bookings"
            >
              <FaBell />
              {pendingCount > 0 && (
                <Badge
                  bg="danger"
                  pill
                  className="position-absolute"
                  style={{ top: '-5px', right: '-5px', fontSize: '0.65rem' }}
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </Badge>
              )}
            </Button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-view-site d-none d-md-inline-flex"
            >
              <FaExternalLinkAlt className="me-2" />
              View Site
            </a>

            <Dropdown align="end" className="admin-user-dropdown">
              <Dropdown.Toggle
                variant="light"
                className="admin-user-toggle"
              >
                <div className="admin-user-avatar" style={{ background: theme.primary }}>
                  {owner?.username?.charAt(0).toUpperCase() || 'O'}
                </div>
                <span className="admin-user-name d-none d-md-inline">{owner?.username || 'Owner'}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="admin-user-menu">
                <Dropdown.Item onClick={handleLogout} className="admin-logout-item">
                  <FaSignOutAlt className="me-2" /> Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        {/* Page Content - Pass theme to children */}
        <div className="admin-content p-4">
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, { theme })
              : child
          )}
        </div>
      </main>
    </div>
  );
};

const SidebarContent = ({ navItems, location, onLogout, owner, onClose, pendingCount, theme }) => (
  <div className="admin-sidebar-inner d-flex flex-column h-100">
    {/* Brand */}
    <div className="admin-sidebar-brand">
      <Link to="/owner/dashboard" className="admin-brand-link">
        <span className="admin-brand-icon">🏖️</span>
        <div className="admin-brand-text">
          <span className="admin-brand-name">AllenShores</span>
          <span className="admin-brand-panel">OWNER PANEL</span>
        </div>
      </Link>
      {onClose && (
        <button className="admin-sidebar-close d-lg-none" onClick={onClose}>
          <FaTimes />
        </button>
      )}
    </div>

    {/* Beach Info */}
    <div className="owner-sidebar-beach-info">
      <FaUmbrellaBeach className="me-2" />
      <span>{owner?.beach_name || owner?.username || 'My Beach'}</span>
    </div>

    {/* Navigation */}
    <Nav className="admin-sidebar-nav flex-column flex-grow-1 py-3">
      <small className="admin-nav-section">Manage</small>
      {navItems.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <Nav.Link
            key={item.path}
            as={NavLink}
            to={item.path}
            onClick={onClose}
            className={`admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span className="admin-nav-label">{item.label}</span>
            {item.path === '/owner/bookings' && pendingCount > 0 && (
              <Badge bg="danger" pill className="ms-auto" style={{ fontSize: '0.7rem' }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </Badge>
            )}
            {isActive && <span className="admin-nav-active-dot"></span>}
          </Nav.Link>
        );
      })}
    </Nav>

    {/* User Profile */}
    <div className="admin-sidebar-user">
      <div className="admin-sidebar-user-info">
        <div className="admin-sidebar-avatar" style={{ background: theme?.primaryLight || '#14b8a6' }}>
          {owner?.username?.charAt(0).toUpperCase() || 'O'}
        </div>
        <div className="admin-sidebar-user-text">
          <div className="admin-sidebar-username">{owner?.username || 'Owner'}</div>
          <div className="admin-sidebar-role">Beach Owner</div>
        </div>
      </div>
      <Button
        variant="link"
        className="admin-sidebar-logout"
        onClick={onLogout}
      >
        <FaSignOutAlt /> Sign Out
      </Button>
    </div>
  </div>
);

export default OwnerLayout;
