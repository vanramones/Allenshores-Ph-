import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Table } from 'react-bootstrap';
import { FaCalendarCheck, FaStar, FaUsers, FaClock, FaCheckCircle, FaHourglassHalf, FaChartLine } from 'react-icons/fa';
import { ownerAPI } from '../../services/api';
import Loading from '../../components/common/Loading';

const OwnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const statCards = [
    { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: <FaCalendarCheck />, color: '#0077b6', bg: '#e0f2fe' },
    { label: 'Pending', value: stats?.pendingBookings || 0, icon: <FaHourglassHalf />, color: '#b45309', bg: '#fef3c7' },
    { label: 'Confirmed', value: stats?.confirmedBookings || 0, icon: <FaCheckCircle />, color: '#065f46', bg: '#d1fae5' },
    { label: 'Total Guests', value: stats?.totalGuests || 0, icon: <FaUsers />, color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Reviews', value: stats?.totalReviews || 0, icon: <FaStar />, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Today', value: stats?.todayBookings || 0, icon: <FaClock />, color: '#0891b2', bg: '#cffafe' }
  ];

  return (
    <div className="fade-in">
      {/* Beach Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{stats?.beach?.name || 'My Beach'}</h2>
          <p className="text-muted mb-0">
            <FaCalendarCheck className="me-1" />
            {stats?.beach?.location || ''} · Owner Dashboard
          </p>
        </div>
        <Badge bg="info" className="p-2">
          <FaChartLine className="me-1" /> {stats?.weekBookings || 0} bookings this week
        </Badge>
      </div>

      {/* Stat Cards */}
      <Row className="g-3 mb-4">
        {statCards.map((stat, i) => (
          <Col xs={6} md={4} lg={2} key={i}>
            <Card className="admin-stat-card h-100">
              <Card.Body className="text-center">
                <div className="admin-stat-icon" style={{ background: stat.bg, color: stat.color }}>
                  {stat.icon}
                </div>
                <h3 className="admin-stat-value">{stat.value}</h3>
                <p className="admin-stat-label">{stat.label}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        {/* Booking Trend Chart */}
        <Col lg={7}>
          <Card className="admin-chart-card">
            <Card.Header className="admin-card-header">
              <h5 className="mb-0">Booking Trend (7 Days)</h5>
            </Card.Header>
            <Card.Body>
              <div className="admin-chart-bars">
                {trend.map((day, i) => (
                  <div key={i} className="admin-chart-bar-item">
                    <div className="admin-chart-bar-wrapper">
                      <div
                        className="admin-chart-bar"
                        style={{
                          height: `${(day.count / maxTrend) * 200 + 10}px`,
                          background: 'linear-gradient(180deg, #0f766e 0%, #14b8a6 100%)'
                        }}
                      >
                        <span className="admin-chart-bar-value">{day.count}</span>
                      </div>
                    </div>
                    <small className="admin-chart-bar-label">{day.label}</small>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Bookings */}
        <Col lg={5}>
          <Card className="admin-table-card">
            <Card.Header className="admin-card-header">
              <h5 className="mb-0">Recent Bookings</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {recentBookings.length === 0 ? (
                <p className="text-muted text-center p-4">No bookings yet</p>
              ) : (
                <Table responsive className="admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map(booking => (
                      <tr key={booking.id}>
                        <td>
                          <div className="fw-semibold">{booking.full_name}</div>
                          <small className="text-muted">{booking.booking_ref}</small>
                        </td>
                        <td>{new Date(booking.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td>
                          <Badge bg={booking.status === 'confirmed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'}>
                            {booking.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OwnerDashboard;
