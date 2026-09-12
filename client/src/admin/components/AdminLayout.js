import React, { useState, useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Nav, Button, Dropdown } from 'react-bootstrap';
import { 
  FaTachometerAlt, FaUmbrellaBeach, FaStar, FaCalendarCheck, 
  FaUserShield, FaSignOutAlt, FaBars, FaTimes, FaExternalLinkAlt,
  FaBell, FaRegCalendarCheck, FaRegCommentAlt, FaCheck, FaFileAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';

const getNotifId = (activity) => `${activity.type}-${activity.id}`;

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    const stored = localStorage.getItem('allenShoresAdminReadNotifications');
    return stored ? JSON.parse(stored) : [];
  });
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    localStorage.setItem('allenShoresAdminReadNotifications', JSON.stringify(readIds));
  }, [readIds]);

  const fetchActivities = async () => {
    try {
      const response = await dashboardAPI.getActivity();
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const notifCount = useMemo(() => {
    return activities.filter(a => !readIds.includes(getNotifId(a))).length;
  }, [activities, readIds]);

  const markAsRead = (e, activity) => {
    e.stopPropagation();
    const id = getNotifId(activity);
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const markAllAsRead = () => {
    setReadIds(activities.map(a => getNotifId(a)));
  };

  const isRead = (activity) => readIds.includes(getNotifId(activity));

  const handleNotificationClick = (activity) => {
    setNotifOpen(false);
    const id = getNotifId(activity);
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id]);
    if (activity.type === 'booking') {
      navigate('/admin/bookings');
    } else if (activity.type === 'review') {
      navigate('/admin/reviews');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/admin/beaches', icon: <FaUmbrellaBeach />, label: 'Beaches' },
    { path: '/admin/bookings', icon: <FaCalendarCheck />, label: 'Bookings' },
    { path: '/admin/reviews', icon: <FaStar />, label: 'Reviews' },
    { path: '/admin/admins', icon: <FaUserShield />, label: 'Admin Accounts' },
    { path: '/admin/reports', icon: <FaFileAlt />, label: 'Reports' }
  ];

  const getPageTitle = () => {
    return navItems.find(item => item.path === location.pathname)?.label || 'Admin';
  };

  return (
    <div className="admin-layout d-flex">
      {/* Mobile Overlay */}
      <div 
        className={`admin-sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - Desktop */}
      <aside className="admin-sidebar d-none d-lg-flex">
        <SidebarContent 
          navItems={navItems} 
          location={location} 
          onLogout={handleLogout} 
          admin={admin} 
        />
      </aside>

      {/* Sidebar - Mobile */}
      <aside className={`admin-sidebar admin-sidebar-mobile d-lg-none ${sidebarOpen ? 'open' : ''}`}>
        <SidebarContent 
          navItems={navItems} 
          location={location} 
          onLogout={handleLogout} 
          admin={admin} 
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
                AllenShores Admin / {getPageTitle()}
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

            <Dropdown align="end" className="admin-notif-dropdown" show={notifOpen} onToggle={(isOpen) => setNotifOpen(isOpen)}>
              <Dropdown.Toggle variant="light" className="admin-notification-btn" id="notification-dropdown">
                <FaBell />
                {notifCount > 0 && <span className="admin-notification-count">{notifCount}</span>}
              </Dropdown.Toggle>
              <Dropdown.Menu className="admin-notif-menu">
                <Dropdown.Header className="admin-notif-header">
                  <strong>Notifications</strong>
                  {notifCount > 0 && (
                    <button className="admin-notif-markall" onClick={markAllAsRead}>
                      <FaCheck className="me-1" /> Mark all as read
                    </button>
                  )}
                </Dropdown.Header>
                {activities.length === 0 ? (
                  <Dropdown.ItemText className="admin-notif-empty">
                    No new notifications
                  </Dropdown.ItemText>
                ) : (
                  activities.map((activity) => (
                    <div key={getNotifId(activity)} className={`admin-notif-item ${isRead(activity) ? 'read' : ''}`} onClick={() => handleNotificationClick(activity)}>
                      <div className="admin-notif-icon" style={{ background: activity.type === 'booking' ? '#d1fae5' : '#fef3c7', color: activity.type === 'booking' ? '#065f46' : '#b45309' }}>
                        {activity.type === 'booking' ? <FaRegCalendarCheck /> : <FaRegCommentAlt />}
                      </div>
                      <div className="admin-notif-content">
                        <p className="admin-notif-text">
                          {activity.type === 'booking' ? (
                            <><strong>{activity.who}</strong> made a booking (Ref: {activity.ref})</>
                          ) : (
                            <><strong>{activity.who}</strong> left a review on {activity.beach_name}</>
                          )}
                        </p>
                        <small className="admin-notif-time">
                          {new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {!isRead(activity) && <span className="admin-notif-unread-dot"></span>}
                        </small>
                      </div>
                      <button
                        className={`admin-notif-read-btn ${isRead(activity) ? 'read' : ''}`}
                        onClick={(e) => markAsRead(e, activity)}
                        title={isRead(activity) ? 'Marked as read' : 'Mark as read'}
                      >
                        <FaCheck />
                      </button>
                    </div>
                  ))
                )}
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown align="end" className="admin-user-dropdown">
              <Dropdown.Toggle 
                variant="light" 
                className="admin-user-toggle"
              >
                <div className="admin-user-avatar">
                  {admin?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="admin-user-name d-none d-md-inline">{admin?.username || 'Admin'}</span>
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

const SidebarContent = ({ navItems, location, onLogout, admin, onClose }) => (
  <div className="admin-sidebar-inner d-flex flex-column h-100">
    {/* Brand */}
    <div className="admin-sidebar-brand">
      <Link to="/admin/dashboard" className="admin-brand-link">
        <span className="admin-brand-icon"><FaUmbrellaBeach /></span>
        <div className="admin-brand-text">
          <span className="admin-brand-name">AllenShores</span>
          <span className="admin-brand-panel">ADMIN PANEL</span>
        </div>
      </Link>
      {onClose && (
        <button className="admin-sidebar-close d-lg-none" onClick={onClose}>
          <FaTimes />
        </button>
      )}
    </div>

    {/* Navigation */}
    <Nav className="admin-sidebar-nav flex-column flex-grow-1 py-3">
      <small className="admin-nav-section">Main Menu</small>
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
        <div className="admin-sidebar-avatar">
          {admin?.username?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="admin-sidebar-user-text">
          <div className="admin-sidebar-username">{admin?.username || 'Admin'}</div>
          <div className="admin-sidebar-role">Administrator</div>
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

export default AdminLayout;
