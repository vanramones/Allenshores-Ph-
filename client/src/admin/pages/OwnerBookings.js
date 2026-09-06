import React, { useState, useEffect } from 'react';
import { Table, Badge, Form, Button, InputGroup, Dropdown, Modal, Row, Col } from 'react-bootstrap';
import { FaSearch, FaFilter, FaTrash, FaEye, FaEnvelope } from 'react-icons/fa';
import { ownerAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

const OwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewBooking, setViewBooking] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailBooking, setEmailBooking] = useState(null);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [search, statusFilter, sortBy]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await ownerAPI.getBookings({
        search: search || undefined,
        status: statusFilter,
        sort: sortBy
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await ownerAPI.updateBookingStatus(id, status);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    }
  };

  const handleDelete = async () => {
    try {
      await ownerAPI.deleteBooking(deleteId);
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const handleOpenEmail = (booking) => {
    setEmailBooking(booking);
    setEmailData({ subject: '', message: '' });
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      toast.warning('Subject and message are required');
      return;
    }
    setSendingEmail(true);
    try {
      await ownerAPI.sendBookingEmail(emailBooking.id, emailData);
      toast.success(`Email sent to ${emailBooking.email}`);
      setShowEmailModal(false);
      setEmailBooking(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusBadge = (status) => {
    const variant = status === 'confirmed' ? 'success' : status === 'cancelled' ? 'danger' : 'warning';
    return <Badge bg={variant}>{status}</Badge>;
  };

  if (loading) return <Loading text="Loading bookings..." />;

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Bookings</h2>
          <p className="text-muted mb-0">Manage bookings for your beach</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters-bar mb-3">
        <InputGroup className="admin-search-input">
          <InputGroup.Text><FaSearch /></InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search by name, email, ref, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        <Form.Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </Form.Select>

        <Form.Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="admin-filter-select"
        >
          <option value="newest">Newest First</option>
          <option value="date_asc">Visit Date ↑</option>
          <option value="date_desc">Visit Date ↓</option>
          <option value="name">Guest Name</option>
        </Form.Select>
      </div>

      {/* Bookings Table */}
      <div className="admin-table-wrapper">
        <Table responsive className="admin-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Guest</th>
              <th>Contact</th>
              <th>Visit Date</th>
              <th>People</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map(booking => (
                <tr key={booking.id}>
                  <td><code>{booking.booking_ref}</code></td>
                  <td>
                    <div className="fw-semibold">{booking.full_name}</div>
                    <small className="text-muted">{booking.email}</small>
                  </td>
                  <td>{booking.phone}</td>
                  <td>{new Date(booking.visit_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td>{booking.people}</td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        size="sm"
                        variant="outline-info"
                        onClick={() => { setViewBooking(booking); setShowViewModal(true); }}
                        title="View"
                      >
                        <FaEye />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleOpenEmail(booking)}
                        title="Send Email"
                      >
                        <FaEnvelope />
                      </Button>
                      <Dropdown>
                        <Dropdown.Toggle size="sm" variant="outline-secondary">
                          <FaFilter />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleStatusUpdate(booking.id, 'pending')}>Mark Pending</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStatusUpdate(booking.id, 'confirmed')}>Mark Confirmed</Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStatusUpdate(booking.id, 'cancelled')}>Mark Cancelled</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => { setDeleteId(booking.id); setShowDeleteModal(true); }}
                        title="Delete"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Booking Details - {viewBooking?.booking_ref}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewBooking && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Guest Name:</strong> {viewBooking.full_name}
                </Col>
                <Col md={6}>
                  <strong>Email:</strong> {viewBooking.email}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Phone:</strong> {viewBooking.phone}
                </Col>
                <Col md={6}>
                  <strong>Visit Date:</strong> {new Date(viewBooking.visit_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Number of People:</strong> {viewBooking.people}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong> {getStatusBadge(viewBooking.status)}
                </Col>
              </Row>
              {viewBooking.message && (
                <Row className="mb-3">
                  <Col>
                    <strong>Message:</strong>
                    <p className="mt-1 p-2 bg-light rounded">{viewBooking.message}</p>
                  </Col>
                </Row>
              )}
              <Row>
                <Col>
                  <strong>Booked on:</strong> {new Date(viewBooking.created_at).toLocaleString('en-US')}
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this booking? This action cannot be undone.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Email Modal */}
      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEnvelope className="me-2" />
            Send Email to Guest
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {emailBooking && (
            <div>
              <div className="mb-3 p-3 bg-light rounded">
                <strong>To:</strong> {emailBooking.full_name}<br/>
                <strong>Email:</strong> {emailBooking.email}<br/>
                <strong>Booking Ref:</strong> {emailBooking.booking_ref}
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Subject *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter email subject..."
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Message *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  placeholder="Type your message to the guest..."
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                />
                <Form.Text className="text-muted">
                  Your beach name will be automatically included in the email subject.
                </Form.Text>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSendEmail}
            disabled={sendingEmail}
            style={{ background: '#0f766e', borderColor: '#0f766e' }}
          >
            {sendingEmail ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Sending...
              </>
            ) : (
              <>
                <FaEnvelope className="me-1" /> Send Email
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OwnerBookings;
