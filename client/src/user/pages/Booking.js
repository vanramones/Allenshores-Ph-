import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaCalendarCheck, FaUser, FaEnvelope, FaPhone, FaGlobe, FaUsers, FaCheck } from 'react-icons/fa';
import { beachesAPI, bookingsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Booking = () => {
  const [searchParams] = useSearchParams();
  const preselectedBeachId = searchParams.get('beach');
  
  const [beaches, setBeaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    beach_id: preselectedBeachId || '',
    full_name: '',
    email: '',
    phone: '',
    nationality: 'Filipino',
    visit_date: '',
    people: 1,
    visit_type: 'day_trip',
    activity_pref: '',
    notes: '',
    terms: false
  });

  useEffect(() => {
    fetchBeaches();
  }, []);

  const fetchBeaches = async () => {
    try {
      const response = await beachesAPI.getAll();
      setBeaches(response.data);
    } catch (error) {
      console.error('Error fetching beaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedBeach = beaches.find(b => b.id === parseInt(formData.beach_id));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.terms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setSubmitting(true);
    try {
      const response = await bookingsAPI.create(formData);
      setSuccess(response.data);
      toast.success('Booking submitted successfully!');
      // Reset form
      setFormData({
        beach_id: '',
        full_name: '',
        email: '',
        phone: '',
        nationality: 'Filipino',
        visit_date: '',
        people: 1,
        visit_type: 'day_trip',
        activity_pref: '',
        notes: '',
        terms: false
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit booking');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedBeach) return 0;
    return (parseFloat(selectedBeach.price) || 0) * formData.people;
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  if (success) {
    return (
      <div className="fade-in py-5">
        <Container>
          <Card className="mx-auto" style={{ maxWidth: '500px' }}>
            <Card.Body className="text-center py-5">
              <div 
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                style={{ width: 80, height: 80, background: '#d1fae5' }}
              >
                <FaCheck size={40} color="#10b981" />
              </div>
              <h2 className="fw-bold mb-3">Booking Submitted!</h2>
              <p className="text-muted mb-4">
                Your booking reference is:
              </p>
              <div className="bg-light rounded p-3 mb-4">
                <h3 className="fw-bold text-primary mb-0">{success.booking_ref}</h3>
              </div>
              <p className="text-muted small mb-4">
                We've sent a confirmation email to {success.email}. 
                Please wait for approval from the beach management.
              </p>
              <Button variant="primary" onClick={() => setSuccess(null)}>
                Make Another Booking
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="booking-page fade-in py-4">
      <Container>
        <Row className="g-4">
          {/* Booking Form */}
          <Col lg={8}>
            <Card>
              <Card.Header className="bg-white">
                <h4 className="mb-0 fw-bold">
                  <FaCalendarCheck className="me-2 text-primary" />
                  Book Your Beach Visit
                </h4>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  {/* Personal Information */}
                  <h5 className="fw-bold mb-3">Personal Information</h5>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label><FaUser className="me-1" /> Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label><FaEnvelope className="me-1" /> Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label><FaPhone className="me-1" /> Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+63 XXX XXX XXXX"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label><FaGlobe className="me-1" /> Nationality</Form.Label>
                        <Form.Control
                          type="text"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleChange}
                          placeholder="Filipino"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Trip Details */}
                  <h5 className="fw-bold mb-3">Trip Details</h5>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Select Beach</Form.Label>
                        <Form.Select
                          name="beach_id"
                          value={formData.beach_id}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Choose a beach...</option>
                          {beaches.map(beach => (
                            <option key={beach.id} value={beach.id}>
                              {beach.name} - ₱{beach.price}/visit
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Visit Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="visit_date"
                          value={formData.visit_date}
                          onChange={handleChange}
                          min={today}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label><FaUsers className="me-1" /> Number of People</Form.Label>
                        <Form.Control
                          type="number"
                          name="people"
                          value={formData.people}
                          onChange={handleChange}
                          min={1}
                          max={50}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Visit Type</Form.Label>
                        <Form.Select
                          name="visit_type"
                          value={formData.visit_type}
                          onChange={handleChange}
                        >
                          <option value="day_trip">Day Trip</option>
                          <option value="overnight">Overnight</option>
                          <option value="extended">Extended Stay</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Activity Preference</Form.Label>
                        <Form.Select
                          name="activity_pref"
                          value={formData.activity_pref}
                          onChange={handleChange}
                        >
                          <option value="">Select...</option>
                          <option value="swimming">Swimming</option>
                          <option value="snorkeling">Snorkeling</option>
                          <option value="relaxation">Relaxation</option>
                          <option value="photography">Photography</option>
                          <option value="mixed">Mixed Activities</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>Special Requests</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          placeholder="Any special requests or notes..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Terms */}
                  <Form.Check
                    type="checkbox"
                    id="terms"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    label="I agree to the terms and conditions and understand that this booking is subject to approval"
                    className="mb-4"
                  />

                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    className="w-100"
                    disabled={submitting || !formData.beach_id}
                  >
                    {submitting ? 'Submitting...' : 'Submit Booking'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Booking Summary */}
          <Col lg={4}>
            <Card className="sticky-top" style={{ top: '80px' }}>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0 fw-bold">Booking Summary</h5>
              </Card.Header>
              <Card.Body>
                {selectedBeach ? (
                  <>
                    <div className="mb-3">
                      <img
                        src={selectedBeach.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80'}
                        alt={selectedBeach.name}
                        className="w-100 rounded"
                        style={{ height: '150px', objectFit: 'cover' }}
                      />
                    </div>
                    <h5 className="fw-bold">{selectedBeach.name}</h5>
                    <p className="text-muted small mb-3">{selectedBeach.location}</p>
                    
                    <hr />
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Visit Date</span>
                      <span>{formData.visit_date || '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">People</span>
                      <span>{formData.people}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Price per person</span>
                      <span>₱{selectedBeach.price || 0}</span>
                    </div>
                    
                    <hr />
                    
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold">Total Estimate</span>
                      <span className="h4 fw-bold text-primary mb-0">₱{calculateTotal()}</span>
                    </div>
                    
                    <Alert variant="info" className="mt-3 mb-0 small">
                      <strong>Note:</strong> Final price may vary. Payment will be collected at the beach.
                    </Alert>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted">
                    <FaCalendarCheck size={40} className="mb-3 opacity-50" />
                    <p className="mb-0">Select a beach to see booking summary</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Booking;
