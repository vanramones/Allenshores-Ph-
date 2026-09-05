import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { reviewsAPI, beachesAPI } from '../../services/api';
import StarRating from '../../components/common/StarRating';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [beaches, setBeaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ beach_id: '', sort: '' });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    beach_id: '',
    author: '',
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const [reviewsRes, beachesRes] = await Promise.all([
        reviewsAPI.getAll(filter),
        beachesAPI.getAll()
      ]);
      setReviews(reviewsRes.data);
      setBeaches(beachesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.beach_id || !formData.author) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create(formData);
      toast.success('Review submitted successfully!');
      setFormData({ beach_id: '', author: '', rating: 5, comment: '' });
      setShowForm(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 3.5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="reviews-page fade-in py-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold mb-1">Beach Reviews</h1>
            <p className="text-muted mb-0">Read what visitors are saying about our beaches</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Write a Review'}
          </Button>
        </div>

        {/* Review Form */}
        {showForm && (
          <Card className="mb-4">
            <Card.Body>
              <h5 className="fw-bold mb-3">Write Your Review</h5>
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Select Beach *</Form.Label>
                      <Form.Select
                        name="beach_id"
                        value={formData.beach_id}
                        onChange={handleFormChange}
                        required
                      >
                        <option value="">Choose a beach...</option>
                        {beaches.map(beach => (
                          <option key={beach.id} value={beach.id}>{beach.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Your Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleFormChange}
                        placeholder="Enter your name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Rating *</Form.Label>
                      <Form.Select
                        name="rating"
                        value={formData.rating}
                        onChange={handleFormChange}
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                        <option value={4}>⭐⭐⭐⭐ Good</option>
                        <option value={3}>⭐⭐⭐ Average</option>
                        <option value={2}>⭐⭐ Poor</option>
                        <option value={1}>⭐ Terrible</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label>Your Review</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="comment"
                        value={formData.comment}
                        onChange={handleFormChange}
                        placeholder="Share your experience..."
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Button type="submit" variant="primary" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">Filter by Beach</Form.Label>
                  <Form.Select
                    value={filter.beach_id}
                    onChange={(e) => handleFilterChange('beach_id', e.target.value)}
                  >
                    <option value="">All Beaches</option>
                    {beaches.map(beach => (
                      <option key={beach.id} value={beach.id}>{beach.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">Sort By</Form.Label>
                  <Form.Select
                    value={filter.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                  >
                    <option value="">Newest First</option>
                    <option value="rating_high">Highest Rating</option>
                    <option value="rating_low">Lowest Rating</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <p className="text-muted mb-0">
                  Showing {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Reviews List */}
        {loading ? (
          <Loading text="Loading reviews..." />
        ) : reviews.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
            <h4>No reviews yet</h4>
            <p className="text-muted">Be the first to share your experience!</p>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Write a Review
            </Button>
          </div>
        ) : (
          <Row className="g-4">
            {reviews.map(review => (
              <Col xs={12} md={6} key={review.id}>
                <Card className="review-card h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bold mb-1">{review.author}</h5>
                        <p className="text-muted small mb-0">
                          <FaMapMarkerAlt className="me-1" />
                          {review.beach_name || 'Beach'}
                        </p>
                      </div>
                      <Badge 
                        style={{ 
                          background: getRatingColor(review.rating),
                          fontSize: '0.9rem',
                          padding: '0.4em 0.8em'
                        }}
                      >
                        <FaStar className="me-1" />
                        {review.rating}
                      </Badge>
                    </div>
                    
                    <StarRating rating={review.rating} size="sm" />
                    
                    <p className="mt-3 mb-2" style={{ color: '#475569' }}>
                      {review.comment || 'No comment provided.'}
                    </p>
                    
                    <small className="text-muted">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Reviews;
