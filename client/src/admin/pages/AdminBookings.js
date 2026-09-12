import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Row, Col, Button, Badge, Modal, InputGroup } from 'react-bootstrap';
import { FaSearch, FaCheck, FaTimes, FaEye, FaTrash, FaEnvelope, FaCalendarCheck, FaHome, FaBed } from 'react-icons/fa';
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

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

  const handleStatusChange = async (id, status) => {
    try {
      await bookingsAPI.updateStatus(id, status);
      toast.success(`Booking ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      await bookingsAPI.delete(id);
      toast.success('Booking deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete booking');
    }
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

  const openEmailModal = (booking) => {
    setSelectedBooking(booking);
    setEmailData({
      subject: `Important Update - ${booking.booking_ref}`,
      message: ''
    });
    setShowEmailModal(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailData.subject.trim() || !emailData.message.trim()) {
      toast.error('Please enter both subject and message');
      return;
    }
    setSendingEmail(true);
    try {
      await bookingsAPI.sendEmail(selectedBooking.id, emailData);
      toast.success('Email sent successfully');
      setShowEmailModal(false);
      setEmailData({ subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
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
      <h2 className="fw-bold mb-4">Manage Bookings</h2>

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
                  <th>Cottage</th>
                  <th>Room</th>
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
                    <td>
                      {booking.cottage_name ? (
                        <span><FaHome className="me-1 text-success" />{booking.cottage_name} ×{booking.cottage_qty || 1}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {booking.room_name ? (
                        <span><FaBed className="me-1 text-info" />{booking.room_name} ×{booking.room_qty || 1}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex gap-1">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleStatusChange(booking.id, 'confirmed')}
                              title="Confirm"
                            >
                              <FaCheck />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              title="Cancel"
                            >
                              <FaTimes />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => viewBooking(booking.id)}
                          title="View Details"
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => openEmailModal(booking)}
                          title="Send Email"
                        >
                          <FaEnvelope />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(booking.id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </Button>
                      </div>
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
              <Col md={6}>
                <strong>Cottage:</strong>
                <p>
                  {selectedBooking.cottage_name
                    ? `${selectedBooking.cottage_name} ×${selectedBooking.cottage_qty || 1} (₱${selectedBooking.cottage_price || 0})`
                    : 'None'}
                </p>
              </Col>
              <Col md={6}>
                <strong>Room:</strong>
                <p>
                  {selectedBooking.room_name
                    ? `${selectedBooking.room_name} ×${selectedBooking.room_qty || 1} (₱${selectedBooking.room_price || 0})`
                    : 'None'}
                </p>
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
          {selectedBooking?.status === 'pending' && (
            <>
              <Button 
                variant="success" 
                onClick={() => {
                  handleStatusChange(selectedBooking.id, 'confirmed');
                  setShowModal(false);
                }}
              >
                <FaCheck className="me-1" /> Confirm
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  handleStatusChange(selectedBooking.id, 'cancelled');
                  setShowModal(false);
                }}
              >
                <FaTimes className="me-1" /> Cancel
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Send Email Modal */}
      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEnvelope className="me-2" />
            Send Email to Customer
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSendEmail}>
          <Modal.Body>
            {selectedBooking && (
              <>
                <div className="mb-3 p-3 bg-light rounded">
                  <p className="mb-1"><strong>To:</strong> {selectedBooking.full_name} ({selectedBooking.email})</p>
                  <p className="mb-0"><strong>Booking:</strong> {selectedBooking.booking_ref} - {selectedBooking.beach_name}</p>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label>Quick Message</Form.Label>
                  <div className="d-flex flex-wrap gap-2">
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => setEmailData({
                        subject: `Reminder - Your visit on ${selectedBooking.visit_date}`,
                        message: `Hi ${selectedBooking.full_name},\n\nThis is a friendly reminder that your booking at ${selectedBooking.beach_name} is coming up on ${selectedBooking.visit_date}.\n\nBooking Reference: ${selectedBooking.booking_ref}\nNumber of Guests: ${selectedBooking.people}\n\nWe look forward to seeing you soon!\n\nBest regards,\nAllenShores PH`
                      })}
                    >
                      Reminder
                    </Button>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => setEmailData({
                        subject: 'Thank you for your booking!',
                        message: `Hi ${selectedBooking.full_name},\n\nThank you for choosing AllenShores PH! We appreciate your booking at ${selectedBooking.beach_name}.\n\nWe hope you have a wonderful and memorable beach experience. If you have any questions, feel free to reach out to us.\n\nBooking Reference: ${selectedBooking.booking_ref}\n\nBest regards,\nAllenShores PH`
                      })}
                    >
                      Thank You
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => setEmailData({
                        subject: `Reschedule Request - ${selectedBooking.booking_ref}`,
                        message: `Hi ${selectedBooking.full_name},\n\nWe received a request to reschedule your booking at ${selectedBooking.beach_name}.\n\nPlease reply to this email with your preferred new visit date, or contact us so we can assist you in finding the best available schedule.\n\nBooking Reference: ${selectedBooking.booking_ref}\n\nBest regards,\nAllenShores PH`
                      })}
                    >
                      Reschedule
                    </Button>
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                    placeholder="Email subject"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={emailData.message}
                    onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                    required
                    placeholder="Type your message here..."
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={sendingEmail}>
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBookings;
