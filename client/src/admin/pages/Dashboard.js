import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { 
  FaUmbrellaBeach, FaStar, FaCalendarCheck, FaChartLine, 
  FaClock, FaCalendarWeek, FaHourglassHalf, FaUsers,
  FaArrowUp, FaArrowDown, FaArrowRight
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { dashboardAPI } from '../../services/api';
import Loading from '../../components/common/Loading';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentBeaches, setRecentBeaches] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingTrend, setBookingTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, beachesRes, reviewsRes, bookingsRes, trendRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentBeaches(),
        dashboardAPI.getRecentReviews(),
        dashboardAPI.getRecentBookings(),
        dashboardAPI.getBookingTrend()
      ]);
      setStats(statsRes.data);
      setRecentBeaches(beachesRes.data);
      setRecentReviews(reviewsRes.data);
      setRecentBookings(bookingsRes.data);
      setBookingTrend(trendRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: bookingTrend.map(t => t.label),
    datasets: [
      {
        fill: true,
        label: 'Bookings',
        data: bookingTrend.map(t => t.count),
        borderColor: '#0077b6',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(0, 119, 182, 0.25)');
          gradient.addColorStop(1, 'rgba(0, 119, 182, 0.0)');
          return gradient;
        },
        tension: 0.5,
        pointBackgroundColor: '#0077b6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { precision: 0 },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'success',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'} className="admin-status-badge">{status}</Badge>;
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) {
      return current > 0 ? { value: 100, positive: true } : { value: 0, positive: true };
    }
    const change = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(change), positive: change >= 0 };
  };

  const kpiData = [
    { 
      icon: <FaClock />, 
      label: "Today's Bookings", 
      value: stats?.todayBookings || 0, 
      prevValue: stats?.yesterdayBookings || 0,
      color: 'blue',
      route: '/admin/bookings'
    },
    { 
      icon: <FaCalendarWeek />, 
      label: 'This Week', 
      value: stats?.weekBookings || 0, 
      prevValue: stats?.lastWeekBookings || 0,
      color: 'green',
      route: '/admin/bookings'
    },
    { 
      icon: <FaHourglassHalf />, 
      label: 'Pending Approval', 
      value: stats?.pendingBookings || 0, 
      prevValue: stats?.lastWeekPending || 0,
      color: 'orange',
      route: '/admin/bookings?status=pending'
    },
    { 
      icon: <FaUsers />, 
      label: 'Expected Guests', 
      value: stats?.totalGuestsWeek || 0, 
      prevValue: stats?.lastWeekGuests || 0,
      color: 'purple',
      route: '/admin/bookings'
    }
  ];

  const kpiCards = kpiData.map(kpi => ({
    ...kpi,
    trend: calculateTrend(kpi.value, kpi.prevValue)
  }));

  if (loading) return <Loading text="Loading dashboard..." />;

  const statCards = [
    { icon: <FaUmbrellaBeach />, label: 'Total Beaches', value: stats?.totalBeaches || 0, color: '#0077b6', bg: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', route: '/admin/beaches' },
    { icon: <FaStar />, label: 'Total Reviews', value: stats?.totalReviews || 0, color: '#f59e0b', bg: 'linear-gradient(135deg, #fef3c7, #fffbeb)', route: '/admin/reviews' },
    { icon: <FaCalendarCheck />, label: 'Total Bookings', value: stats?.totalBookings || 0, color: '#10b981', bg: 'linear-gradient(135deg, #d1fae5, #ecfdf5)', route: '/admin/bookings' },
    { icon: <FaChartLine />, label: 'Avg Rating', value: stats?.avgRating || 0, color: '#8b5cf6', bg: 'linear-gradient(135deg, #ede9fe, #f5f3ff)', route: '/admin/reviews' }
  ];

  const colorMap = {
    blue: { icon: '#0077b6', bg: '#e0f2fe' },
    green: { icon: '#10b981', bg: '#d1fae5' },
    orange: { icon: '#f59e0b', bg: '#fef3c7' },
    purple: { icon: '#8b5cf6', bg: '#ede9fe' }
  };

  return (
    <div className="admin-dashboard fade-in">
      {/* Welcome Banner */}
      <div className="admin-welcome-banner mb-4">
        <div className="admin-welcome-content">
          <div>
            <h2 className="admin-welcome-title">Welcome back, Admin! 👋</h2>
            <p className="admin-welcome-subtitle">Here's what's happening with AllenShores today.</p>
          </div>
          <div className="admin-welcome-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        {kpiCards.map((kpi, index) => (
          <Col xs={6} lg={3} key={index}>
            <Card className="admin-kpi-card h-100 border-0" onClick={() => navigate(kpi.route)}>
              <Card.Body>
                <div className="admin-kpi-header d-flex align-items-center gap-2 flex-wrap mb-2">
                  <div 
                    className="admin-kpi-icon"
                    style={{ background: colorMap[kpi.color].bg, color: colorMap[kpi.color].icon }}
                  >
                    {kpi.icon}
                  </div>
                  <div className={`admin-kpi-trend ${kpi.trend.positive ? '' : 'negative'}`}>
                    {kpi.trend.positive ? <FaArrowUp className="me-1" /> : <FaArrowDown className="me-1" />}
                    {kpi.trend.value}%
                  </div>
                </div>
                <h3 className="admin-kpi-value">{kpi.value}</h3>
                <p className="admin-kpi-label">{kpi.label}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {statCards.map((stat, index) => (
          <Col xs={6} lg={3} key={index}>
            <Card className="admin-stat-card h-100 border-0" onClick={() => navigate(stat.route)}>
              <Card.Body className="admin-stat-body d-flex align-items-center gap-2">
                <div 
                  className="admin-stat-icon"
                  style={{ background: stat.bg, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="admin-stat-label">{stat.label}</p>
                  <h3 className="admin-stat-value">{stat.value}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart & Recent Bookings */}
      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="admin-chart-card h-100 border-0">
            <Card.Header className="admin-card-header">
              <div>
                <h5 className="admin-card-title">Booking Trend</h5>
                <p className="admin-card-subtitle">Last 7 days performance</p>
              </div>
              <Link to="/admin/bookings" className="admin-view-all">
                View All <FaArrowRight className="ms-1" />
              </Link>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="admin-recent-card h-100 border-0">
            <Card.Header className="admin-card-header">
              <div>
                <h5 className="admin-card-title">Recent Bookings</h5>
                <p className="admin-card-subtitle">Latest reservations</p>
              </div>
              <Link to="/admin/bookings" className="admin-view-all">
                View All <FaArrowRight className="ms-1" />
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {recentBookings.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="admin-empty-icon">📅</div>
                  <p className="admin-empty-text">No bookings yet</p>
                </div>
              ) : (
                <div className="admin-booking-list">
                  {recentBookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="admin-booking-item">
                      <div className="admin-booking-info">
                        <strong>{booking.full_name}</strong>
                        <small>{booking.beach_name}</small>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Tables */}
      <Row className="g-4">
        <Col lg={6}>
          <Card className="admin-table-card border-0">
            <Card.Header className="admin-card-header">
              <div>
                <h5 className="admin-card-title">Recent Beaches</h5>
                <p className="admin-card-subtitle">Newly added destinations</p>
              </div>
              <Link to="/admin/beaches" className="admin-view-all">
                View All <FaArrowRight className="ms-1" />
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="admin-table mb-0">
                <thead>
                  <tr>
                    <th>Beach Name</th>
                    <th>Rating</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBeaches.map(beach => (
                    <tr key={beach.id}>
                      <td>
                        <div className="admin-table-cell">
                          <span className="admin-table-name">{beach.name}</span>
                        </div>
                      </td>
                      <td>
                        <Badge className="admin-rating-badge">
                          <FaStar className="me-1" />
                          {parseFloat(beach.rating || 0).toFixed(1)}
                        </Badge>
                      </td>
                      <td>₱{beach.price}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="admin-table-card border-0">
            <Card.Header className="admin-card-header">
              <div>
                <h5 className="admin-card-title">Recent Reviews</h5>
                <p className="admin-card-subtitle">Latest visitor feedback</p>
              </div>
              <Link to="/admin/reviews" className="admin-view-all">
                View All <FaArrowRight className="ms-1" />
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="admin-table mb-0">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Beach</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReviews.map(review => (
                    <tr key={review.id}>
                      <td>
                        <div className="admin-table-cell">
                          <span className="admin-table-avatar">{review.author?.charAt(0).toUpperCase()}</span>
                          <span className="admin-table-name">{review.author}</span>
                        </div>
                      </td>
                      <td>{review.beach_name}</td>
                      <td>
                        <Badge className="admin-rating-badge">
                          <FaStar className="me-1" />
                          {review.rating}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
