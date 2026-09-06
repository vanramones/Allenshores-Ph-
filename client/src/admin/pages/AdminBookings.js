import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Row, Col, Button, Badge, Modal, InputGroup } from 'react-bootstrap';
import { FaSearch, FaEye, FaCalendarCheck, FaLock } from 'react-icons/fa';
import { bookingsAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    from_date: '',
    to_date: '',
    sort: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        bookingsAPI.getAll(filters),
        bookingsAPI.getStats()
      ]);
      setBookings(bookingsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const viewBooking = async (id) => {
    try {
      const response = await bookingsAPI.getById(id);
      setSelectedBooking(response.data);
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load booking details');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: 'warning', text: 'Pending' },
      confirmed: { bg: 'success', text: 'Confirmed' },
      cancelled: { bg: 'danger', text: 'Cancelled' }
    };
    const { bg, text } = config[status] || { bg: 'secondary', text: status };
    return <Badge bg={bg}>{text}</Badge>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <Loading text="Loading bookings..." />;

  return (
    <div className="admin-bookings fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Bookings Overview</h2>
        <Badge bg="secondary" className="d-flex align-items-center gap-1 p-2">
          <FaLock className="me-1" /> Read-Only (Owners manage their own bookings)
        </Badge>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card 
            className="text-center cursor-pointer" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleFilterChange('status', '')}
          >
            <Card.Body>
              <h3 className="fw-bold text-primary">{stats.total}</h3>
              <small className="text-muted">Total</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card 
            className="text-center" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleFilterChange('status', 'pending')}
          >
            <Card.Body>
              <h3 className="fw-bold text-warning">{stats.pending}</h3>
              <small className="text-muted">Pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card 
            className="text-center" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleFilterChange('status', 'confirmed')}
          >
            <Card.Body>
              <h3 className="fw-bold text-success">{stats.confirmed}</h3>
              <small className="text-muted">Confirmed</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card 
            className="text-center" 
            style={{ cursor: 'pointer' }}
            onClick={() => handleFilterChange('status', 'cancelled')}
          >
            <Card.Body>
              <h3 className="fw-bold text-danger">{stats.cancelled}</h3>
              <small className="text-muted">Cancelled</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} sm={6} md={4}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search name, email, ref..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
                <Button variant="primary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={filters.from_date}
                onChange={(e) => handleFilterChange('from_date', e.target.value)}
                placeholder="From Date"
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={filters.to_date}
                onChange={(e) => handleFilterChange('to_date', e.target.value)}
                placeholder="To Date"
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="">Newest</option>
                <option value="date_asc">Visit Date ↑</option>
                <option value="date_desc">Visit Date ↓</option>
                <option value="name">Name A-Z</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Bookings Table */}
      <Card>
        <Card.Body className="p-0">
          {bookings.length === 0 ? (
            <div className="text-center py-5">
              <FaCalendarCheck size={48} className="text-muted mb-3" />
              <h5>No bookings found</h5>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Customer</th>
                  <th>Beach</th>
                  <th>Visit Date</th>
                  <th>People</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id} onClick={() => viewBooking(booking.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <code className="text-primary">{booking.booking_ref}</code>
                    </td>
                    <td>
                      <strong>{booking.full_name}</strong>
                      <br />
                      <small className="text-muted">{booking.email}</small>
                    </td>
                    <td>{booking.beach_name || 'N/A'}</td>
                    <td>{formatDate(booking.visit_date)}</td>
                    <td>{booking.people}</td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => viewBooking(booking.id)}
                        title="View Details"
                      >
                        <FaEye />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* View Booking Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Booking Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <Row className="g-3">
              <Col md={6}>
                <strong>Reference:</strong>
                <p className="text-primary">{selectedBooking.booking_ref}</p>
              </Col>
              <Col md={6}>
                <strong>Status:</strong>
                <p>{getStatusBadge(selectedBooking.status)}</p>
              </Col>
              <Col md={6}>
                <strong>Customer Name:</strong>
                <p>{selectedBooking.full_name}</p>
              </Col>
              <Col md={6}>
                <strong>Email:</strong>
                <p>{selectedBooking.email}</p>
              </Col>
              <Col md={6}>
                <strong>Phone:</strong>
                <p>{selectedBooking.phone || 'N/A'}</p>
              </Col>
              <Col md={6}>
                <strong>Nationality:</strong>
                <p>{selectedBooking.nationality || 'N/A'}</p>
              </Col>
              <Col md={6}>
                <strong>Beach:</strong>
                <p>{selectedBooking.beach_name}</p>
              </Col>
              <Col md={6}>
                <strong>Visit Date:</strong>
                <p>{formatDate(selectedBooking.visit_date)}</p>
              </Col>
              <Col md={6}>
                <strong>Number of People:</strong>
                <p>{selectedBooking.people}</p>
              </Col>
              <Col md={6}>
                <strong>Visit Type:</strong>
                <p>{selectedBooking.visit_type || 'Day Trip'}</p>
              </Col>
              <Col xs={12}>
                <strong>Special Requests:</strong>
                <p>{selectedBooking.notes || 'None'}</p>
              </Col>
              <Col xs={12}>
                <strong>Booked On:</strong>
                <p>{formatDate(selectedBooking.created_at)}</p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminBookings;
