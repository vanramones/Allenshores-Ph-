import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Nav, Button, Dropdown } from 'react-bootstrap';
import {
  FaTachometerAlt, FaCalendarCheck, FaStar, FaFileAlt, FaEdit,
  FaSignOutAlt, FaBars, FaTimes, FaExternalLinkAlt, FaUmbrellaBeach
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const OwnerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { owner, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div className="admin-layout d-flex">
      {/* Mobile Overlay */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - Desktop */}
      <aside className="admin-sidebar d-none d-lg-flex" style={{ background: 'linear-gradient(180deg, #0f766e 0%, #134e4a 100%)' }}>
        <SidebarContent
          navItems={navItems}
          location={location}
          onLogout={handleLogout}
          owner={owner}
        />
      </aside>

      {/* Sidebar - Mobile */}
      <aside className={`admin-sidebar admin-sidebar-mobile d-lg-none ${sidebarOpen ? 'open' : ''}`} style={{ background: 'linear-gradient(180deg, #0f766e 0%, #134e4a 100%)' }}>
        <SidebarContent
          navItems={navItems}
          location={location}
          onLogout={handleLogout}
          owner={owner}
          onClose={() => setSidebarOpen(false)}
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
                <div className="admin-user-avatar" style={{ background: '#0f766e' }}>
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

        {/* Page Content */}
        <div className="admin-content p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

const SidebarContent = ({ navItems, location, onLogout, owner, onClose }) => (
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
            {isActive && <span className="admin-nav-active-dot"></span>}
          </Nav.Link>
        );
      })}
    </Nav>

    {/* User Profile */}
    <div className="admin-sidebar-user">
      <div className="admin-sidebar-user-info">
        <div className="admin-sidebar-avatar" style={{ background: '#0f766e' }}>
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
