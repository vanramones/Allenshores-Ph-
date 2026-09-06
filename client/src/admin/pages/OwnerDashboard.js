import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Table, Button, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaCalendarCheck, FaStar, FaUsers, FaClock, FaCheckCircle, FaHourglassHalf,
  FaChartLine, FaMapMarkerAlt, FaArrowRight, FaUmbrellaBeach,
  FaEye, FaCalendarAlt, FaUserFriends, FaWater, FaChartBar
} from 'react-icons/fa';
import { ownerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/common/Loading';

// Default theme (will be overridden by props from OwnerLayout)
const defaultTheme = {
  name: 'sunrise',
  primary: '#ea580c',
  primaryDark: '#9a3412',
  primaryLight: '#fb923c',
  gradient: 'linear-gradient(180deg, #ea580c 0%, #9a3412 100%)',
  welcomeGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
  shadow: 'rgba(234, 88, 12, 0.3)',
  accent: '#ffedd5'
};

const OwnerDashboard = ({ theme: propTheme }) => {
  const { owner } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use theme from props or default
  const theme = propTheme || defaultTheme;

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [statsRes, bookingsRes, trendRes] = await Promise.all([
        ownerAPI.getDashboard(),
        ownerAPI.getRecentBookings(),
        ownerAPI.getBookingTrend()
      ]);
      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
      setTrend(trendRes.data);
    } catch (error) {
      console.error('Error fetching owner dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Loading your dashboard..." />;

  const maxTrend = Math.max(...trend.map(t => t.count), 1);
  const totalBookings = stats?.totalBookings || 0;
  const pendingBookings = stats?.pendingBookings || 0;
  const confirmedBookings = stats?.confirmedBookings || 0;
  const confirmationRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;

  return (
    <div className={`owner-dashboard fade-in owner-theme-${theme.name}`}>
      {/* Welcome Header */}
      <div className="owner-welcome-card mb-4" style={{ background: theme.welcomeGradient, boxShadow: `0 10px 40px ${theme.shadow}` }}>
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center mb-3">
              <div className="owner-beach-avatar me-3">
                <FaUmbrellaBeach />
              </div>
              <div>
                <h2 className="owner-welcome-title mb-1">
                  Welcome back, {owner?.username || 'Owner'}!
                </h2>
                <p className="owner-welcome-subtitle mb-0">
                  <FaMapMarkerAlt className="me-1" />
                  {stats?.beach?.name || 'Your Beach'} · {stats?.beach?.location || 'Allen, Northern Samar'}
                </p>
              </div>
            </div>
            <div className="owner-quick-stats d-flex flex-wrap gap-3">
              <div className="owner-quick-stat">
                <FaCalendarAlt className="me-2" />
                <span><strong>{stats?.todayBookings || 0}</strong> bookings today</span>
              </div>
              <div className="owner-quick-stat">
                <FaUserFriends className="me-2" />
                <span><strong>{stats?.weekBookings || 0}</strong> this week</span>
              </div>
              <div className="owner-quick-stat">
                <FaHourglassHalf className="me-2" style={{ color: '#f59e0b' }} />
                <span><strong>{pendingBookings}</strong> pending approval</span>
              </div>
            </div>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <Link to="/owner/bookings">
              <Button variant="light" className="owner-action-btn">
                <FaEye className="me-2" /> View All Bookings
                <FaArrowRight className="ms-2" />
              </Button>
            </Link>
          </Col>
        </Row>
      </div>

      {/* Main Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <Card className="owner-stat-card owner-stat-primary">
            <Card.Body>
              <div className="owner-stat-icon-wrap">
                <FaCalendarCheck />
              </div>
              <div className="owner-stat-content">
                <h3 className="owner-stat-number">{totalBookings}</h3>
                <p className="owner-stat-label">Total Bookings</p>
              </div>
              <div className="owner-stat-trend">
                <FaChartBar className="me-1" />
                All time
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="owner-stat-card owner-stat-warning">
            <Card.Body>
              <div className="owner-stat-icon-wrap">
                <FaHourglassHalf />
              </div>
              <div className="owner-stat-content">
                <h3 className="owner-stat-number">{pendingBookings}</h3>
                <p className="owner-stat-label">Pending</p>
              </div>
              <Link to="/owner/bookings" className="owner-stat-action">
                Review Now <FaArrowRight />
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="owner-stat-card owner-stat-success">
            <Card.Body>
              <div className="owner-stat-icon-wrap">
                <FaCheckCircle />
              </div>
              <div className="owner-stat-content">
                <h3 className="owner-stat-number">{confirmedBookings}</h3>
                <p className="owner-stat-label">Confirmed</p>
              </div>
              <div className="owner-stat-trend">
                {confirmationRate}% rate
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="owner-stat-card owner-stat-info">
            <Card.Body>
              <div className="owner-stat-icon-wrap">
                <FaUsers />
              </div>
              <div className="owner-stat-content">
                <h3 className="owner-stat-number">{stats?.totalGuests || 0}</h3>
                <p className="owner-stat-label">Total Guests</p>
              </div>
              <div className="owner-stat-trend">
                <FaStar className="me-1" style={{ color: '#fbbf24' }} />
                {stats?.totalReviews || 0} reviews
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts and Tables Row */}
      <Row className="g-4 mb-4">
        {/* Booking Trend Chart */}
        <Col lg={8}>
          <Card className="owner-chart-card h-100">
            <Card.Header className="owner-card-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">
                    <FaChartLine className="me-2" style={{ color: theme.primary }} />
                    Booking Trend
                  </h5>
                  <small className="text-muted">Last 7 days performance</small>
                </div>
                <Badge bg="light" text="dark" className="px-3 py-2">
                  <FaWater className="me-1" /> {trend.reduce((sum, d) => sum + d.count, 0)} total
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="owner-chart-container">
                {trend.map((day, i) => (
                  <div key={i} className="owner-chart-bar-group">
                    <div className="owner-chart-bar-container">
                      <div
                        className="owner-chart-bar"
                        style={{
                          height: `${Math.max((day.count / maxTrend) * 100, 5)}%`,
                          background: `linear-gradient(180deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`
                        }}
                      >
                        <span className="owner-chart-bar-value" style={{ color: theme.primary, background: theme.accent }}>{day.count}</span>
                      </div>
                    </div>
                    <span className="owner-chart-bar-label">{day.label}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Performance Summary */}
        <Col lg={4}>
          <Card className="owner-performance-card h-100">
            <Card.Header className="owner-card-header">
              <h5 className="mb-0">
                <FaChartBar className="me-2" style={{ color: theme.primary }} />
                Performance
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="owner-performance-item mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Confirmation Rate</span>
                  <strong>{confirmationRate}%</strong>
                </div>
                <ProgressBar 
                  now={confirmationRate} 
                  variant="success" 
                  style={{ height: '8px', borderRadius: '4px' }}
                />
              </div>
              
              <div className="owner-performance-item mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Today's Progress</span>
                  <strong>{stats?.todayBookings || 0} bookings</strong>
                </div>
                <ProgressBar 
                  now={Math.min((stats?.todayBookings || 0) * 20, 100)} 
                  variant="info" 
                  style={{ height: '8px', borderRadius: '4px' }}
                />
              </div>

              <div className="owner-performance-item">
                <div className="d-flex justify-content-between mb-2">
                  <span>Weekly Target</span>
                  <strong>{stats?.weekBookings || 0} / 10</strong>
                </div>
                <ProgressBar 
                  now={Math.min((stats?.weekBookings || 0) * 10, 100)} 
                  variant="warning" 
                  style={{ height: '8px', borderRadius: '4px' }}
                />
              </div>

              <hr className="my-4" />

              <div className="owner-quick-actions">
                <Link to="/owner/beach" className="owner-quick-action-btn" style={{ '--hover-bg': theme.primary }}>
                  <FaUmbrellaBeach className="me-2" /> Edit Beach Info
                </Link>
                <Link to="/owner/reviews" className="owner-quick-action-btn" style={{ '--hover-bg': theme.primary }}>
                  <FaStar className="me-2" /> View Reviews
                </Link>
                <Link to="/owner/reports" className="owner-quick-action-btn" style={{ '--hover-bg': theme.primary }}>
                  <FaChartLine className="me-2" /> View Reports
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Bookings Table */}
      <Card className="owner-bookings-card">
        <Card.Header className="owner-card-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">
                <FaCalendarCheck className="me-2" style={{ color: theme.primary }} />
                Recent Bookings
              </h5>
              <small className="text-muted">Latest guest reservations</small>
            </div>
            <Link to="/owner/bookings">
              <Button variant="outline-primary" size="sm" style={{ borderColor: theme.primary, color: theme.primary }}>
                View All <FaArrowRight className="ms-1" />
              </Button>
            </Link>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {recentBookings.length === 0 ? (
            <div className="owner-empty-state">
              <FaCalendarCheck className="owner-empty-icon" />
              <h5>No bookings yet</h5>
              <p className="text-muted">When guests book your beach, they'll appear here.</p>
            </div>
          ) : (
            <Table responsive className="owner-table mb-0">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Contact</th>
                  <th>Visit Date</th>
                  <th>People</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      <div className="owner-guest-info">
                        <div className="owner-guest-avatar" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)` }}>
                          {booking.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold">{booking.full_name}</div>
                          <small className="text-muted">{booking.booking_ref}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="small">
                        <div>{booking.email}</div>
                        <div className="text-muted">{booking.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="owner-date-badge">
                        <FaCalendarAlt className="me-1" />
                        {new Date(booking.visit_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark">
                        <FaUsers className="me-1" /> {booking.people}
                      </Badge>
                    </td>
                    <td>
                      <Badge 
                        bg={booking.status === 'confirmed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'}
                        className="owner-status-badge"
                      >
                        {booking.status === 'confirmed' && <FaCheckCircle className="me-1" />}
                        {booking.status === 'pending' && <FaHourglassHalf className="me-1" />}
                        {booking.status}
                      </Badge>
                    </td>
                    <td>
                      <Link to="/owner/bookings" className="btn btn-sm btn-outline-primary">
                        <FaEye />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default OwnerDashboard;
