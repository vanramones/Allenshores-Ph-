import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Modal, Form, Pagination } from 'react-bootstrap';
import { FaTrash, FaStar, FaEye } from 'react-icons/fa';
import { ownerAPI } from '../../services/api';
import Loading from '../../components/common/Loading';

const OwnerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewReview, setViewReview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await ownerAPI.getReviews();
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await ownerAPI.deleteReview(deleteId);
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        style={{ color: i < rating ? '#fbbf24' : '#e5e7eb', fontSize: '0.85rem' }}
      />
    ));
  };

  if (loading) return <Loading text="Loading reviews..." />;

  const indexOfLast = currentPage * reviewsPerPage;
  const indexOfFirst = indexOfLast - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Reviews</h2>
          <p className="text-muted mb-0">Reviews for your beach</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="text-center">
            <div className="fw-bold fs-4" style={{ color: '#fbbf24' }}>{avgRating}</div>
            <small className="text-muted">Avg Rating</small>
          </div>
          <div className="text-center">
            <div className="fw-bold fs-4">{reviews.length}</div>
            <small className="text-muted">Total</small>
          </div>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <Table responsive className="admin-table">
          <thead>
            <tr>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentReviews.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  No reviews yet
                </td>
              </tr>
            ) : (
              currentReviews.map(review => (
                <tr key={review.id}>
                  <td>
                    <div className="fw-semibold">{review.reviewer_name || 'Anonymous'}</div>
                    <small className="text-muted">{review.reviewer_email || ''}</small>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-1">
                      {renderStars(parseInt(review.rating))}
                      <span className="ms-1 text-muted">({review.rating})</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div className="text-truncate" style={{ maxWidth: '280px' }}>
                      {review.comment || 'No comment'}
                    </div>
                  </td>
                  <td>{new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        size="sm"
                        variant="outline-info"
                        onClick={() => { setViewReview(review); setShowViewModal(true); }}
                        title="View"
                      >
                        <FaEye />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => { setDeleteId(review.id); setShowDeleteModal(true); }}
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

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            />
            {[...Array(totalPages)].map((_, i) => (
              <Pagination.Item
                key={i + 1}
                active={i + 1 === currentPage}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Review Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewReview && (
            <div>
              <div className="mb-3">
                <strong>Reviewer:</strong> {viewReview.reviewer_name || 'Anonymous'}
              </div>
              <div className="mb-3">
                <strong>Email:</strong> {viewReview.reviewer_email || 'N/A'}
              </div>
              <div className="mb-3">
                <strong>Rating:</strong>
                <div className="mt-1">{renderStars(parseInt(viewReview.rating))} <span className="text-muted">({viewReview.rating}/5)</span></div>
              </div>
              <div className="mb-3">
                <strong>Comment:</strong>
                <p className="mt-1 p-3 bg-light rounded">{viewReview.comment || 'No comment provided'}</p>
              </div>
              <div>
                <strong>Date:</strong> {new Date(viewReview.created_at).toLocaleString('en-US')}
              </div>
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
        <Modal.Body>Are you sure you want to delete this review? This action cannot be undone.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OwnerReviews;
