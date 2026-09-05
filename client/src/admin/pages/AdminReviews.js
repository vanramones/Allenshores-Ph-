import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaTrash, FaStar, FaExternalLinkAlt } from 'react-icons/fa';
import { reviewsAPI, beachesAPI } from '../../services/api';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [beaches, setBeaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    beach_id: '',
    sort: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [reviewsRes, beachesRes] = await Promise.all([
        reviewsAPI.getAll(filters),
        beachesAPI.getAll()
      ]);
      setReviews(reviewsRes.data);
      setBeaches(beachesRes.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewsAPI.delete(id);
      toast.success('Review deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const getRatingBadge = (rating) => {
    let bg = 'success';
    if (rating < 3) bg = 'danger';
    else if (rating < 4) bg = 'warning';
    
    return (
      <Badge bg={bg} className="d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
        <FaStar /> {rating}
      </Badge>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <Loading text="Loading reviews..." />;

  return (
    <div className="admin-reviews fade-in">
      <h2 className="fw-bold mb-4">Manage Reviews</h2>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col xs={12} sm={6} md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">Filter by Beach</Form.Label>
                <Form.Select
                  value={filters.beach_id}
                  onChange={(e) => handleFilterChange('beach_id', e.target.value)}
                >
                  <option value="">All Beaches</option>
                  {beaches.map(beach => (
                    <option key={beach.id} value={beach.id}>{beach.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">Sort By</Form.Label>
                <Form.Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  <option value="">Newest First</option>
                  <option value="rating_high">Highest Rating</option>
                  <option value="rating_low">Lowest Rating</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={12} md={4} className="d-flex align-items-end">
              <p className="text-muted mb-0">
                Showing {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Reviews Table */}
      <Card>
        <Card.Body className="p-0">
          {reviews.length === 0 ? (
            <div className="text-center py-5">
              <FaStar size={48} className="text-muted mb-3" />
              <h5>No reviews found</h5>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Beach</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review.id} onClick={() => window.open(`/beaches/${review.beach_id}`, '_blank')} style={{ cursor: 'pointer' }}>
                    <td>
                      <strong>{review.author}</strong>
                    </td>
                    <td>{review.beach_name || 'N/A'}</td>
                    <td>{getRatingBadge(review.rating)}</td>
                    <td style={{ maxWidth: '300px' }}>
                      <span className="text-truncate d-inline-block" style={{ maxWidth: '100%' }}>
                        {review.comment || <em className="text-muted">No comment</em>}
                      </span>
                    </td>
                    <td>{formatDate(review.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex gap-1">
                        <a
                          href={`/beaches/${review.beach_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                          title="View Beach"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaExternalLinkAlt />
                        </a>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(review.id)}
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
    </div>
  );
};

export default AdminReviews;
